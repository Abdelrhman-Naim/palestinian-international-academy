import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Converts a decoded AudioBuffer into a standard 16-bit PCM WAV Blob.
 * This completely bypasses the Chromium WebM "Infinity duration" & streaming playback bugs
 * by providing the native <audio> element with a standard seekable WAV file.
 */
function audioBufferToWav(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels = [];
  const sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF chunk descriptor
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);  // file length - 8
  setUint32(0x45564157); // "WAVE"

  // "fmt " sub-chunk
  setUint32(0x20746d66); // "fmt "
  setUint32(16);          // SubChunk1Size (16 for PCM)
  setUint16(1);           // AudioFormat (1 for PCM)
  setUint16(numOfChan);   // NumChannels
  setUint32(sampleRate);  // SampleRate
  setUint32(sampleRate * 2 * numOfChan); // ByteRate
  setUint16(numOfChan * 2);              // BlockAlign
  setUint16(16);                         // BitsPerSample (16-bit)

  // "data" sub-chunk
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4); // SubChunk2Size

  for (let i = 0; i < numOfChan; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

export default function VoicePlayer({ src, duration = 0, isMe = false }) {
  const { dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const audioRef = useRef(null);
  const createdUrlRef = useRef(null);

  const [playableSrc, setPlayableSrc] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(() => {
    const d = Number(duration);
    return d > 0 ? Math.round(d) : 0;
  });
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Strip codec metadata if present in base64 prefix
  const cleanSrc = (typeof src === 'string' && src.startsWith('data:audio/'))
    ? src.replace(/data:audio\/([^;]+);codecs=[^;]+;base64/, 'data:audio/$1;base64')
    : src;

  // Process and decode audio when source changes
  useEffect(() => {
    let active = true;

    // Initialize with prop duration if available
    const propD = Number(duration);
    if (propD > 0) {
      setTotalDuration(Math.round(propD));
    }

    if (!cleanSrc) {
      setIsLoading(false);
      return;
    }

    // Clean up previous blob URL if any
    if (createdUrlRef.current) {
      URL.revokeObjectURL(createdUrlRef.current);
      createdUrlRef.current = null;
    }

    setIsLoading(true);

    (async () => {
      try {
        // If data URL, convert base64 directly to ArrayBuffer in memory (fast & reliable, no fetch needed)
        if (typeof cleanSrc === 'string' && cleanSrc.startsWith('data:audio/')) {
          const parts = cleanSrc.split(',');
          const base64 = parts[1];
          if (base64) {
            const binaryStr = atob(base64);
            const len = binaryStr.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryStr.charCodeAt(i);
            }

            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
              const ctx = new AudioContextClass();
              try {
                const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
                if (active) {
                  const exactDuration = Math.max(1, Math.round(audioBuffer.duration));
                  setTotalDuration(exactDuration);

                  // Convert decoded PCM into standard WAV blob
                  const wavBlob = audioBufferToWav(audioBuffer);
                  const wavUrl = URL.createObjectURL(wavBlob);
                  createdUrlRef.current = wavUrl;

                  setPlayableSrc(wavUrl);
                  setIsLoading(false);
                }
                ctx.close();
                return;
              } catch (decodeErr) {
                ctx.close();
                console.warn('AudioContext decode failed, falling back to direct source:', decodeErr);
              }
            }
          }
        }

        // Fallback for non-base64 or failed decode
        if (active) {
          setPlayableSrc(cleanSrc);
          setIsLoading(false);
        }
      } catch (err) {
        console.warn('Audio processing error:', err);
        if (active) {
          setPlayableSrc(cleanSrc);
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
      if (createdUrlRef.current) {
        URL.revokeObjectURL(createdUrlRef.current);
        createdUrlRef.current = null;
      }
    };
  }, [cleanSrc, duration]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const effDur = totalDuration > 0 ? totalDuration : (Number(duration) > 0 ? Number(duration) : 0);
      if (audio.ended || (effDur > 0 && Math.abs(audio.currentTime - effDur) < 0.3)) {
        audio.currentTime = 0;
        setCurrentTime(0);
      }

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.error('Audio play error:', err);
            setIsPlaying(false);
          });
      }
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (audio) {
      audio.currentTime = seekTime;
    }
  };

  const cyclePlaybackRate = () => {
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs) || !isFinite(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const propDur = Number(duration) > 0 ? Math.round(Number(duration)) : 0;
  const displayDuration = totalDuration > 0 ? totalDuration : propDur;
  const effectiveMax = displayDuration > 0 ? displayDuration : (audioRef.current?.duration && isFinite(audioRef.current.duration) ? Math.round(audioRef.current.duration) : 1);
  const progressPercent = effectiveMax > 0 ? Math.min(100, (currentTime / effectiveMax) * 100) : 0;

  return (
    <div dir="ltr" className="flex items-center gap-3 py-1 min-w-[220px] sm:min-w-[260px] select-none">
      {/* Native HTML5 Audio */}
      {playableSrc && (
        <audio
          ref={audioRef}
          src={playableSrc}
          preload="auto"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          onTimeUpdate={() => {
            if (audioRef.current) {
              const curr = audioRef.current.currentTime;
              setCurrentTime(curr);
              if (displayDuration > 0 && curr >= displayDuration) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                setIsPlaying(false);
                setCurrentTime(0);
              }
            }
          }}
          onError={(e) => {
            console.warn('Audio tag playback error:', e);
            setIsPlaying(false);
          }}
        />
      )}

      {/* Play / Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        disabled={isLoading || !playableSrc}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-sm cursor-pointer disabled:opacity-60 ${
          isMe
            ? 'bg-white text-primary hover:bg-white/90'
            : 'bg-primary text-white hover:bg-secondary'
        }`}
        aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل التسجيل الصوتي'}
        title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل التسجيل الصوتي'}
      >
        <span className="material-symbols-outlined text-2xl">
          {isPlaying ? 'pause' : 'play_arrow'}
        </span>
      </button>

      {/* Track & Time */}
      <div className="flex-1 flex flex-col gap-1.5 justify-center">
        <div className="relative flex items-center">
          <input
            type="range"
            min="0"
            max={effectiveMax || 1}
            step="0.05"
            value={currentTime}
            onChange={handleSeek}
            aria-label={isRtl ? "موضع تشغيل الصوت" : "Audio playback seek position"}
            title={isRtl ? "موضع تشغيل الصوت" : "Audio playback seek position"}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-current focus:outline-none"
            style={{
              accentColor: isMe ? '#FFFFFF' : '#d4af37',
              background: isMe
                ? `linear-gradient(to right, rgba(255,255,255,0.95) ${progressPercent}%, rgba(255,255,255,0.35) ${progressPercent}%)`
                : `linear-gradient(to right, #d4af37 ${progressPercent}%, #E8E2D5 ${progressPercent}%)`
            }}
          />
        </div>

        <div className={`flex items-center justify-between text-[11px] font-mono ${
          isMe ? 'text-white/90 font-semibold' : 'text-gray-600 dark:text-gray-300 font-medium'
        }`}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(displayDuration)}</span>
        </div>
      </div>

      {/* Playback speed toggle */}
      <button
        type="button"
        onClick={cyclePlaybackRate}
        className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 transition-colors cursor-pointer ${
          isMe
            ? 'bg-white/20 hover:bg-white/30 text-white'
            : 'bg-[#E8E2D5] dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-[#DED8CB]'
        }`}
        title={isRtl ? "سرعة التشغيل" : "Playback Speed"}
        aria-label={isRtl ? `سرعة التشغيل: ${playbackRate}x` : `Playback Speed: ${playbackRate}x`}
      >
        {playbackRate}x
      </button>
    </div>
  );
}
