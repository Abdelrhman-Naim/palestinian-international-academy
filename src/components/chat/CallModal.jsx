import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { doc, updateDoc, arrayUnion } from '../../supabase/db';

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
  const isRtl = dir === 'rtl';

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

  const isVideo = activeCall?.type === 'video';
  const isCaller = activeCall?.callerId === currentUser?.uid;
  const partnerName = isCaller ? (activeCall?.calleeName || 'مستخدم') : (activeCall?.callerName || 'مستخدم');
  const status = activeCall?.status || 'ringing';

  // -------------------------------------------------------------
  // 1. MEDIA STREAM ACQUISITION & MANAGEMENT
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || !activeCall) {
      // Clean up when modal is closed
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setLocalStream(null);
      }
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      setRemoteStream(null);
      return;
    }

    // Don't auto-grab cam/mic if it's incoming and not yet answered
    if (isIncoming && status === 'ringing') return;

    let mounted = true;

    async function setupStream() {
      // If we already have live tracks, reuse them
      if (streamRef.current) {
        const live = streamRef.current.getTracks().some(t => t.readyState === 'live');
        if (live) {
          setLocalStream(streamRef.current);
          if (localVideoRef.current && isVideo) {
            localVideoRef.current.srcObject = streamRef.current;
          }
          return;
        }
      }

      try {
        setPermissionError('');
        let stream = null;

        if (isVideo) {
          try {
            // Tier 1: Try camera and mic with standard relaxed constraints (video: true)
            // Avoiding strict facingMode: 'user' or resolution which fails on desktop/laptop webcams
            stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: true
            });
          } catch (vidErr) {
            console.warn('Video + Audio failed, trying audio fallback:', vidErr);
            if (vidErr.name === 'NotAllowedError' || vidErr.name === 'PermissionDeniedError') {
              throw vidErr;
            }
            // Tier 2: If webcam is in use by another tab/app or unavailable, fall back to audio
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            setIsCameraOff(true);
          }
        } else {
          // Voice only call
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }

        if (!mounted) {
          if (stream) stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        setLocalStream(stream);

        if (localVideoRef.current && isVideo && !isCameraOff) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.warn('Could not acquire media stream:', err);
        if (mounted) {
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setPermissionError(isVideo ? t('chat.cameraBlocked') : t('chat.micBlocked'));
          } else if (err.name === 'NotReadableError') {
            setPermissionError('الكاميرا أو الميكروفون قيد الاستخدام من قبل نافذة أو تطبيق آخر');
          } else if (err.name === 'NotFoundError') {
            setPermissionError('لم يتم العثور على كاميرا أو ميكروفون متصل');
          } else {
            setPermissionError(isVideo ? t('chat.cameraBlocked') : t('chat.micBlocked'));
          }
        }
      }
    }

    setupStream();

    return () => {
      mounted = false;
    };
  }, [isOpen, isIncoming, status, isVideo, activeCall?.id]);

  // Connect local video element
  useEffect(() => {
    if (localVideoRef.current && localStream && isVideo) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideo]);

  // Connect remote stream elements
  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current && isVideo) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream, isVideo]);

  // Global unmount cleanup
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // -------------------------------------------------------------
  // 2. WEBRTC P2P SIGNALING & CONNECTION
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || !activeCall?.id || status !== 'connected' || !localStream) return;

    let pc = pcRef.current;
    if (!pc) {
      try {
        pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        });
        pcRef.current = pc;

        // Add local stream tracks to peer connection
        localStream.getTracks().forEach(track => {
          pc.addTrack(track, localStream);
        });

        // Listen for remote tracks
        pc.ontrack = (event) => {
          if (event.streams && event.streams[0]) {
            setRemoteStream(event.streams[0]);
          }
        };

        // Listen for local ICE candidates
        pc.onicecandidate = async (event) => {
          if (event.candidate && activeCall?.id) {
            try {
              const candidateField = isCaller ? 'callerCandidates' : 'calleeCandidates';
              await updateDoc(doc(db, 'calls', activeCall.id), {
                [candidateField]: arrayUnion(event.candidate.toJSON())
              });
            } catch (err) {
              console.warn('Could not save ICE candidate:', err);
            }
          }
        };

        // Caller initiates WebRTC offer
        if (isCaller && !activeCall.offer) {
          pc.createOffer().then(async (offer) => {
            await pc.setLocalDescription(offer);
            await updateDoc(doc(db, 'calls', activeCall.id), {
              offer: { type: offer.type, sdp: offer.sdp }
            });
          }).catch(e => console.warn('WebRTC offer error:', e));
        }
      } catch (err) {
        console.warn('WebRTC peer connection initialization failed:', err);
      }
    }

    // Callee receives offer and creates answer
    if (pc && !isCaller && activeCall.offer && !pc.currentRemoteDescription) {
      pc.setRemoteDescription(new RTCSessionDescription(activeCall.offer))
        .then(() => pc.createAnswer())
        .then(async (answer) => {
          await pc.setLocalDescription(answer);
          await updateDoc(doc(db, 'calls', activeCall.id), {
            answer: { type: answer.type, sdp: answer.sdp }
          });
        })
        .catch(e => console.warn('WebRTC answer error:', e));
    }

    // Caller receives answer from callee
    if (pc && isCaller && activeCall.answer && !pc.currentRemoteDescription) {
      pc.setRemoteDescription(new RTCSessionDescription(activeCall.answer))
        .catch(e => console.warn('WebRTC setRemoteDescription answer error:', e));
    }

    // Exchange ICE candidates
    const candidatesToAdd = isCaller ? activeCall.calleeCandidates : activeCall.callerCandidates;
    if (pc && pc.remoteDescription && Array.isArray(candidatesToAdd)) {
      candidatesToAdd.forEach(cand => {
        try {
          pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
        } catch (e) {}
      });
    }
  }, [isOpen, activeCall?.id, status, localStream, activeCall?.offer, activeCall?.answer, isCaller]);

  // -------------------------------------------------------------
  // 3. CALL TIMER LOGIC
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
  // 4. CALL CONTROLS
  // -------------------------------------------------------------
  const toggleMute = () => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleCamera = () => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCameraOff(!videoTrack.enabled);
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
      {/* Hidden audio element for voice calls remote stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div 
        dir={dir}
        className={`w-full max-w-2xl bg-[#FAF7F2] dark:bg-gray-800 rounded-3xl border border-[#E8E2D5] dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
          isVideo ? 'h-[85vh] max-h-[640px]' : 'h-auto py-8'
        }`}
      >
        
        {/* Permission warning banner */}
        {permissionError && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-800 dark:text-amber-200 px-4 py-2.5 text-xs font-bold text-center flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-base">warning</span>
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
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 text-xs gap-1 bg-gray-800">
                    <span className="material-symbols-outlined text-lg">videocam_off</span>
                    <span>الكاميرا مغلقة</span>
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
                onClick={() => onEndCall(durationSeconds)}
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
