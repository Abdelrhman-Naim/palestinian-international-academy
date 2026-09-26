import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../supabase/client';
import { broadcastToChannel } from '../../services/chatService';

// Helper: Generates a high quality synthetic canvas video track for when camera is off/locked
function createSyntheticVideoTrack(userName = 'مستخدم', subtitle = 'الكاميرا مغلقة') {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  
  const initials = (userName || 'م').trim().slice(0, 2);
  let pulseAngle = 0;

  const render = () => {
    ctx.fillStyle = '#0f172a'; // Slate 900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle radial glow
    const grad = ctx.createRadialGradient(320, 200, 20, 320, 200, 180);
    grad.addColorStop(0, 'rgba(217, 119, 6, 0.2)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Outer pulsating circle
    pulseAngle += 0.06;
    const pulseRadius = 72 + Math.sin(pulseAngle) * 5;
    ctx.beginPath();
    ctx.arc(320, 200, pulseRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner avatar background
    ctx.beginPath();
    ctx.arc(320, 200, 62, 0, Math.PI * 2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Initials text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px Alexandria, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, 320, 202);

    // Name text
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 18px Alexandria, sans-serif';
    ctx.fillText(userName, 320, 296);

    // Status subtitle
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px Alexandria, sans-serif';
    ctx.fillText(subtitle, 320, 324);
  };

  render();
  const interval = setInterval(render, 150); // ~7 fps: low CPU, perfectly stable video stream

  const stream = canvas.captureStream(10);
  const track = stream.getVideoTracks()[0];
  if (track) {
    track._isSynthetic = true;
    track._interval = interval;
    const origStop = track.stop.bind(track);
    track.stop = () => {
      clearInterval(interval);
      origStop();
    };
  }
  return track;
}

export default function CallModal({
  isOpen,
  onClose,
  activeCall,
  currentUser,
  isIncoming = false,
  onAnswer,
  onEndCall,
  onReject
}) {
  const { t, dir } = useLanguage();

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [permissionError, setPermissionError] = useState('');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const pcRef = useRef(null);
  const signalingChanRef = useRef(null);
  const mediaPromiseRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const isVideo = activeCall?.type === 'video';
  const myUid = String(currentUser?.uid || currentUser?.id || '');
  const isCaller = String(activeCall?.callerId || '') === myUid;
  const partnerName = isCaller ? (activeCall?.calleeName || 'مستخدم') : (activeCall?.callerName || 'مستخدم');
  const status = activeCall?.status || 'ringing';

  // -------------------------------------------------------------
  // 1. SOUND EFFECTS (Web Audio API Ringing Tone)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || status !== 'ringing') return;

    let isPlaying = true;
    let audioCtx = null;
    let timer = null;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();

        const playTone = () => {
          if (!isPlaying || !audioCtx || audioCtx.state === 'closed') return;
          if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
          }

          const now = audioCtx.currentTime;
          const osc1 = audioCtx.createOscillator();
          const osc2 = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();

          osc1.type = 'sine';
          osc2.type = 'sine';

          if (isIncoming) {
            osc1.frequency.setValueAtTime(440, now);
            osc2.frequency.setValueAtTime(480, now);
          } else {
            osc1.frequency.setValueAtTime(400, now);
            osc2.frequency.setValueAtTime(450, now);
          }

          gainNode.gain.setValueAtTime(0.04, now);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

          osc1.connect(gainNode);
          osc2.connect(gainNode);
          gainNode.connect(audioCtx.destination);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 1.2);
          osc2.stop(now + 1.2);
        };

        playTone();
        timer = setInterval(playTone, 2400);
      }
    } catch (e) {
      console.warn('Ringtone AudioContext notice:', e);
    }

    return () => {
      isPlaying = false;
      if (timer) clearInterval(timer);
      if (audioCtx) {
        try { audioCtx.close(); } catch {}
      }
    };
  }, [isOpen, status, isIncoming]);

  // -------------------------------------------------------------
  // 2. UNIFIED MEDIA STREAM ACQUISITION
  // -------------------------------------------------------------
  const acquireMedia = async () => {
    // Return existing live stream if already available
    if (streamRef.current) {
      const live = streamRef.current.getTracks().some(t => t.readyState === 'live');
      if (live) return streamRef.current;
    }

    let audioStream = null;
    let videoTrack = null;
    let cameraNotice = '';

    // A. Microphone acquisition (Always priority)
    try {
      audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
    } catch (micErr1) {
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (micErr2) {
        console.warn('Microphone unavailable:', micErr2);
      }
    }

    // B. Video acquisition if video call
    if (isVideo) {
      try {
        const vidStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            facingMode: 'user'
          }
        });
        videoTrack = vidStream.getVideoTracks()[0];
      } catch (vidErr1) {
        try {
          const vidStream2 = await navigator.mediaDevices.getUserMedia({ video: true });
          videoTrack = vidStream2.getVideoTracks()[0];
        } catch (vidErr2) {
          console.warn('Physical camera unavailable or busy in another tab/app:', vidErr2);
          if (vidErr2.name === 'NotReadableError') {
            cameraNotice = 'الكاميرا قيد الاستخدام في علامة تبويب أو تطبيق آخر - تم تفعيل الصوت وعرض الصورة الرمزية';
          } else if (vidErr2.name === 'NotAllowedError') {
            cameraNotice = 'تم حظر إذن الكاميرا - تم تفعيل الصوت فقط';
          } else {
            cameraNotice = 'لم يتم العثور على كاميرا متصلة - تم تفعيل الصوت وعرض الصورة الرمزية';
          }
        }
      }

      // If physical camera failed, generate synthetic track so WebRTC video negotiation succeeds
      if (!videoTrack) {
        videoTrack = createSyntheticVideoTrack(
          currentUser?.name || 'مستخدم',
          cameraNotice ? 'الكاميرا قيد الاستخدام / مغلقة' : 'الكاميرا مغلقة'
        );
        setIsCameraOff(true);
      } else {
        setIsCameraOff(false);
      }
    }

    const combined = new MediaStream();
    if (audioStream) {
      audioStream.getAudioTracks().forEach(t => combined.addTrack(t));
    }
    if (videoTrack) {
      combined.addTrack(videoTrack);
    }

    streamRef.current = combined;
    setLocalStream(combined);
    setPermissionError(cameraNotice);

    if (localVideoRef.current && isVideo) {
      localVideoRef.current.srcObject = combined;
    }

    return combined;
  };

  const getOrInitStream = async () => {
    if (!mediaPromiseRef.current) {
      mediaPromiseRef.current = acquireMedia().finally(() => {
        mediaPromiseRef.current = null;
      });
    }
    return await mediaPromiseRef.current;
  };

  // Manage Stream Lifecycle
  useEffect(() => {
    if (!isOpen || !activeCall) {
      // Cleanup all media tracks on modal close
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => {
          try { t.stop(); } catch {}
        });
        streamRef.current = null;
      }
      if (pcRef.current) {
        try { pcRef.current.close(); } catch {}
        pcRef.current = null;
      }
      setLocalStream(null);
      setRemoteStream(null);
      remoteStreamRef.current = null;
      setPermissionError('');
      setIsCameraOff(false);
      setIsMuted(false);
      return;
    }

    // Do not acquire media yet for incoming ringing call until answered
    if (isIncoming && status === 'ringing') return;

    getOrInitStream();
  }, [isOpen, activeCall?.id, isIncoming, status, isVideo]);

  // Connect local video element
  useEffect(() => {
    if (localVideoRef.current && localStream && isVideo) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideo, isCameraOff]);

  // Connect remote stream elements
  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current && isVideo) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(() => {});
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.volume = 1.0;
        remoteAudioRef.current.play().catch(e => {
          console.warn('Audio play request notice:', e);
        });
      }
    }
  }, [remoteStream, isVideo]);

  // Global unmount cleanup
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => {
          try { t.stop(); } catch {}
        });
      }
      if (pcRef.current) {
        try { pcRef.current.close(); } catch {}
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (signalingChanRef.current) {
        try { supabase.removeChannel(signalingChanRef.current); } catch {}
      }
    };
  }, []);

  // -------------------------------------------------------------
  // 3. WEBRTC P2P SIGNALING & CONNECTION (Supabase Realtime Broadcast)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || !activeCall?.id || status !== 'connected') return;

    let pc = pcRef.current;
    let channel = signalingChanRef.current;
    let pendingCandidates = [];
    let isMounted = true;

    async function initWebRTC() {
      try {
        // Guaranteed stream acquisition before PC negotiation
        const stream = await getOrInitStream();
        if (!isMounted) return;

        // Initialize RTCPeerConnection with Google STUN servers
        pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
          ]
        });
        pcRef.current = pc;

        // Add all local tracks (Audio + Video / Synthetic Video) to peer connection
        if (stream) {
          stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
          });
        }

        // Listen for remote tracks
        pc.ontrack = (event) => {
          let rStream = event.streams && event.streams[0];
          if (!rStream) {
            if (!remoteStreamRef.current) {
              remoteStreamRef.current = new MediaStream();
            }
            remoteStreamRef.current.addTrack(event.track);
            rStream = remoteStreamRef.current;
          } else {
            remoteStreamRef.current = rStream;
          }

          setRemoteStream(rStream);

          if (remoteVideoRef.current && isVideo) {
            remoteVideoRef.current.srcObject = rStream;
            remoteVideoRef.current.play().catch(() => {});
          }
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = rStream;
            remoteAudioRef.current.volume = 1.0;
            remoteAudioRef.current.play().catch(() => {});
          }
        };

        // Realtime Broadcast channel for this call session
        const sessionTopic = `call_session_${activeCall.id}`;
        const existing = supabase.getChannels().find(
          ch => ch.topic === `realtime:${sessionTopic}` || ch.topic === sessionTopic
        );
        channel = existing || supabase.channel(sessionTopic, {
          config: { broadcast: { ack: true, self: false } }
        });
        signalingChanRef.current = channel;

        // ICE candidate handler
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            broadcastToChannel(sessionTopic, 'webrtc_candidate', {
              candidate: event.candidate.toJSON(),
              from: myUid
            });
          }
        };

        const createAndSendOffer = async () => {
          if (!pc || !isCaller) return;
          try {
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: isVideo
            });
            await pc.setLocalDescription(offer);
            await broadcastToChannel(sessionTopic, 'webrtc_offer', {
              offer: { type: offer.type, sdp: offer.sdp },
              from: myUid
            });
          } catch (offErr) {
            console.warn('Could not create offer:', offErr);
          }
        };

        // Handle Offer (Callee)
        channel.on('broadcast', { event: 'webrtc_offer' }, async ({ payload }) => {
          if (!isMounted || !pc || isCaller) return;
          try {
            if (payload?.offer && (!pc.remoteDescription || pc.signalingState === 'stable')) {
              await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
              
              // Flush any buffered ICE candidates
              while (pendingCandidates.length > 0) {
                const c = pendingCandidates.shift();
                try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (e) {}
              }

              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              await broadcastToChannel(sessionTopic, 'webrtc_answer', {
                answer: { type: answer.type, sdp: answer.sdp },
                from: myUid
              });
            }
          } catch (err) {
            console.warn('Error handling WebRTC offer:', err);
          }
        });

        // Handle Answer (Caller)
        channel.on('broadcast', { event: 'webrtc_answer' }, async ({ payload }) => {
          if (!isMounted || !pc || !isCaller) return;
          try {
            if (payload?.answer && pc.signalingState === 'have-local-offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
              
              while (pendingCandidates.length > 0) {
                const c = pendingCandidates.shift();
                try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (e) {}
              }
            }
          } catch (err) {
            console.warn('Error handling WebRTC answer:', err);
          }
        });

        // Handle ICE Candidate
        channel.on('broadcast', { event: 'webrtc_candidate' }, async ({ payload }) => {
          if (!pc || !payload?.candidate) return;
          try {
            if (pc.remoteDescription && pc.remoteDescription.type) {
              await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } else {
              pendingCandidates.push(payload.candidate);
            }
          } catch (err) {
            console.warn('Error adding ICE candidate:', err);
          }
        });

        // Peer ready handshake: When Callee signals ready, Caller produces offer
        channel.on('broadcast', { event: 'peer_ready' }, () => {
          if (isCaller && isMounted) {
            createAndSendOffer();
          }
        });

        // Remote Hangup
        channel.on('broadcast', { event: 'webrtc_end' }, () => {
          if (isMounted && onEndCall) {
            onEndCall(durationSeconds);
          }
        });

        const onChannelReady = () => {
          if (!isMounted) return;
          if (!isCaller) {
            broadcastToChannel(sessionTopic, 'peer_ready', { from: myUid });
          } else {
            setTimeout(() => {
              if (isMounted && isCaller) {
                createAndSendOffer();
              }
            }, 500);
          }
        };

        if (channel.state === 'joined') {
          onChannelReady();
        } else {
          channel.subscribe(async (subStatus) => {
            if (subStatus === 'SUBSCRIBED' && isMounted) {
              onChannelReady();
            }
          });
        }

      } catch (err) {
        console.warn('WebRTC peer initialization error:', err);
      }
    }

    initWebRTC();

    return () => {
      isMounted = false;
      if (pc) {
        try { pc.close(); } catch {}
        pcRef.current = null;
      }
    };
  }, [isOpen, activeCall?.id, status, isCaller, isVideo, myUid]);

  // -------------------------------------------------------------
  // 4. CALL TIMER LOGIC
  // -------------------------------------------------------------
  useEffect(() => {
    if (status === 'connected') {
      setDurationSeconds(0);
      timerRef.current = setInterval(() => {
        setDurationSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // -------------------------------------------------------------
  // 5. CALL CONTROLS
  // -------------------------------------------------------------
  const toggleMute = () => {
    if (!streamRef.current) return;
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleCamera = async () => {
    if (!isVideo || !streamRef.current) return;

    const currentVidTrack = streamRef.current.getVideoTracks()[0];

    // If camera is currently ON with real hardware: switch to OFF (synthetic)
    if (!isCameraOff && currentVidTrack && !currentVidTrack._isSynthetic) {
      currentVidTrack.stop();
      streamRef.current.removeTrack(currentVidTrack);

      const syntheticTrack = createSyntheticVideoTrack(currentUser?.name || 'مستخدم', 'الكاميرا مغلقة');
      streamRef.current.addTrack(syntheticTrack);

      if (pcRef.current) {
        const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          try { await sender.replaceTrack(syntheticTrack); } catch (e) {}
        }
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = streamRef.current;
      }

      setIsCameraOff(true);
      return;
    }

    // If camera is currently OFF or synthetic: attempt to turn ON real camera
    try {
      const vidStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });
      const newRealTrack = vidStream.getVideoTracks()[0];

      if (currentVidTrack) {
        currentVidTrack.stop();
        streamRef.current.removeTrack(currentVidTrack);
      }
      streamRef.current.addTrack(newRealTrack);

      if (pcRef.current) {
        const sender = pcRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          try { await sender.replaceTrack(newRealTrack); } catch (e) {}
        }
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = streamRef.current;
      }

      setIsCameraOff(false);
      setPermissionError('');
    } catch (err) {
      console.warn('Could not acquire real camera track:', err);
      if (err.name === 'NotReadableError') {
        setPermissionError('الكاميرا قيد الاستخدام حالياً في علامة تبويب أو تطبيق آخر');
      } else if (err.name === 'NotAllowedError') {
        setPermissionError(t('chat.cameraBlocked') || 'تم حظر إذن الكاميرا');
      } else {
        setPermissionError('تعذر تشغيل الكاميرا');
      }
    }
  };

  const handleHangup = () => {
    try {
      if (activeCall?.id) {
        broadcastToChannel(`call_session_${activeCall.id}`, 'webrtc_end', { from: myUid });
      }
    } catch {}
    if (onEndCall) {
      onEndCall(durationSeconds);
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!isOpen || !activeCall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in font-alexandria">
      {/* Dedicated audio element for remote stream in both voice & video calls */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div 
        dir={dir}
        className={`w-full max-w-2xl bg-[#FAF7F2] dark:bg-gray-800 rounded-3xl border border-[#E8E2D5] dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isVideo ? 'h-[85vh] max-h-[640px]' : 'h-auto py-8'
        }`}
      >
        
        {/* Permission / In-Use Notice Banner */}
        {permissionError && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-800 dark:text-amber-200 px-4 py-2 text-xs font-semibold text-center flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-base shrink-0">info</span>
            <span>{permissionError}</span>
          </div>
        )}

        {/* Video Mode Screen */}
        {isVideo ? (
          <div className="relative flex-1 bg-gray-950 flex items-center justify-center overflow-hidden">
            {/* Main/Remote Stream or Avatar Placeholder */}
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                muted={true}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-6 z-10">
                <div className="relative mb-4">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-secondary text-white flex items-center justify-center text-3xl sm:text-4xl font-extrabold shadow-xl">
                    {partnerName?.[0] || 'م'}
                  </div>
                  {status === 'ringing' && (
                    <span className="absolute -inset-2 rounded-3xl border-2 border-primary animate-ping pointer-events-none opacity-40"></span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white mb-1">
                  {partnerName}
                </h3>
                <div className="text-sm font-semibold text-gray-400">
                  {status === 'connected' ? (
                    <span className="text-emerald-400 flex items-center gap-1.5 justify-center">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      {formatTimer(durationSeconds)}
                    </span>
                  ) : isCaller ? (
                    t('chat.ringing')
                  ) : (
                    t('chat.incomingVideoCall')
                  )}
                </div>
              </div>
            )}

            {/* Local PIP Video Preview */}
            {localStream && (
              <div className="absolute bottom-4 inset-s-4 w-32 sm:w-40 aspect-video bg-gray-900 rounded-2xl overflow-hidden border-2 border-primary shadow-2xl z-20">
                {!isCameraOff ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover -scale-x-100"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 text-xs gap-1 bg-gray-900/90 p-2 text-center">
                    <span className="material-symbols-outlined text-lg text-amber-400">videocam_off</span>
                    <span className="text-[10px] leading-tight font-medium">الكاميرا مغلقة</span>
                  </div>
                )}
                <div className="absolute top-1 inset-e-1 px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-white font-bold">
                  {t('chat.you')}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Voice Mode Screen */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-6">
            <div className="relative mb-6">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-secondary text-white flex items-center justify-center text-4xl sm:text-5xl font-extrabold shadow-xl">
                {partnerName?.[0] || 'م'}
              </div>

              {/* Pulsing rings during ringing */}
              {status === 'ringing' && (
                <>
                  <span className="absolute -inset-3 rounded-3xl border-2 border-primary animate-ping opacity-30 pointer-events-none"></span>
                  <span className="absolute -inset-6 rounded-3xl border-2 border-primary animate-pulse opacity-20 pointer-events-none"></span>
                </>
              )}

              {/* Connected icon */}
              {status === 'connected' && (
                <span className="absolute -bottom-2 -right-2 w-9 h-9 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-xl">phone_in_talk</span>
                </span>
              )}
            </div>

            <h3 className="text-2xl font-black text-dark dark:text-white mb-2">
              {partnerName}
            </h3>

            {/* Status & Timer */}
            <div className="mb-4">
              {status === 'connected' ? (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-base font-bold border border-emerald-500/20">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{formatTimer(durationSeconds)}</span>
                </div>
              ) : (
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {isCaller 
                    ? (isVideo ? `${t('chat.outgoingVideoCall')}... ${t('chat.calling')}` : `${t('chat.outgoingVoiceCall')}... ${t('chat.calling')}`)
                    : (isVideo ? t('chat.incomingVideoCall') : t('chat.incomingCall'))}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="p-4 sm:p-6 bg-[#F3EFE6]/70 dark:bg-gray-800/90 border-t border-[#E8E2D5] dark:border-gray-700 flex items-center justify-center gap-4 sm:gap-6 shrink-0">
          
          {/* If Incoming and Still Ringing: Answer and Decline Buttons */}
          {isIncoming && status === 'ringing' ? (
            <>
              <button
                type="button"
                onClick={onReject}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-lg hover:shadow-rose-500/30 transition-all active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">call_end</span>
                <span>{t('chat.decline')}</span>
              </button>

              <button
                type="button"
                onClick={onAnswer}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95 animate-bounce cursor-pointer"
              >
                <span className="material-symbols-outlined text-xl">
                  {isVideo ? 'videocam' : 'call'}
                </span>
                <span>{t('chat.answer')}</span>
              </button>
            </>
          ) : (
            /* Active / Outgoing Call Controls */
            <>
              {/* Mute Mic */}
              <button
                type="button"
                onClick={toggleMute}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all active:scale-95 cursor-pointer ${
                  isMuted
                    ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400'
                    : 'bg-white dark:bg-gray-700 border-[#E8E2D5] dark:border-gray-600 text-dark dark:text-white hover:bg-gray-100'
                }`}
                title={isMuted ? t('chat.unmuteMic') : t('chat.muteMic')}
                aria-label={isMuted ? t('chat.unmuteMic') : t('chat.muteMic')}
              >
                <span className="material-symbols-outlined text-2xl">
                  {isMuted ? 'mic_off' : 'mic'}
                </span>
              </button>

              {/* Toggle Video (If Video Mode) */}
              {isVideo && (
                <button
                  type="button"
                  onClick={toggleCamera}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all active:scale-95 cursor-pointer ${
                    isCameraOff
                      ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400'
                      : 'bg-white dark:bg-gray-700 border-[#E8E2D5] dark:border-gray-600 text-dark dark:text-white hover:bg-gray-100'
                  }`}
                  title={isCameraOff ? t('chat.turnOnCamera') : t('chat.turnOffCamera')}
                  aria-label={isCameraOff ? t('chat.turnOnCamera') : t('chat.turnOffCamera')}
                >
                  <span className="material-symbols-outlined text-2xl">
                    {isCameraOff ? 'videocam_off' : 'videocam'}
                  </span>
                </button>
              )}

              {/* End Call Button */}
              <button
                type="button"
                onClick={handleHangup}
                className="w-14 h-14 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg hover:shadow-rose-500/30 transition-all active:scale-95 cursor-pointer"
                title={t('chat.endCall')}
                aria-label={t('chat.endCall')}
              >
                <span className="material-symbols-outlined text-2xl">call_end</span>
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
