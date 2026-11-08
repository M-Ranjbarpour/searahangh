import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, Sparkles, Activity } from 'lucide-react';
import { ExtractedAudioFeatures } from '../services/audioProcessor';

interface AudioPlayerWaveformProps {
  audioUrl: string;
  audioFeatures: ExtractedAudioFeatures | null;
  onClearAudio: () => void;
  onReAnalyze: () => void;
  isProcessing: boolean;
  fileName?: string;
}

export const AudioPlayerWaveform: React.FC<AudioPlayerWaveformProps> = ({
  audioUrl,
  audioFeatures,
  onClearAudio,
  onReAnalyze,
  isProcessing,
  fileName,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || audioFeatures?.duration || 0);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioFeatures?.duration]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (index: number) => {
    if (!audioRef.current || !duration) return;
    const seekTime = (index / 100) * duration;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const peaks = audioFeatures?.peaks || new Array(100).fill(0.3);

  return (
    <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-4 sm:p-5 shadow-xl">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* هدر پلیر و نام فایل */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-stone-800/80 text-xs text-stone-400">
        <div className="flex items-center gap-2 truncate">
          <Volume2 className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="font-medium text-stone-200 truncate">
            {fileName || 'صوت ضبط شده با میکروفون'}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {audioFeatures && (
            <div className="hidden sm:flex items-center gap-2 text-[11px] text-stone-400">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-amber-500" />
                <span>تمپو: {audioFeatures.tempoBpm} BPM</span>
              </span>
              <span>·</span>
              <span>{Math.round(audioFeatures.duration * 10) / 10} ثانیه</span>
            </div>
          )}

          <button
            onClick={onClearAudio}
            disabled={isProcessing}
            className="text-stone-400 hover:text-stone-200 text-xs hover:underline flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>حذف و دوباره</span>
          </button>
        </div>
      </div>

      {/* شکل‌موج صوتی قابل کلیک برای جابجایی زمان */}
      <div className="relative my-4 select-none">
        <div
          className="flex items-center justify-between gap-[2px] h-16 w-full cursor-pointer px-1 group"
          title="جهت پرش به زمان مشخص روی شکل‌موج کلیک کنید"
        >
          {peaks.map((val, idx) => {
            const barPercent = (idx / peaks.length) * 100;
            const isPassed = barPercent <= currentPercent;
            const barHeight = Math.max(8, val * 56);

            return (
              <div
                key={idx}
                onClick={() => handleSeek(idx)}
                className="flex-1 flex items-center justify-center h-full hover:opacity-80 transition-opacity"
              >
                <div
                  className={`w-full rounded-full transition-all duration-75 ${
                    isPassed
                      ? 'bg-amber-400'
                      : 'bg-stone-700 group-hover:bg-stone-600'
                  }`}
                  style={{ height: `${barHeight}px` }}
                />
              </div>
            );
          })}
        </div>

        {/* نشانگر خط عمودی موقعیت پخش */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-amber-400 pointer-events-none transition-all duration-75 shadow-sm shadow-amber-400"
          style={{ right: `${currentPercent}%` }}
        />
      </div>

      {/* کنترل‌های پخش صوتی و زمان */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            disabled={isProcessing}
            className="w-10 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 flex items-center justify-center transition-all shadow-md shadow-amber-500/20"
            aria-label={isPlaying ? "توقف پخش" : "پخش صدا"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current mr-0.5" />
            )}
          </button>

          <div className="text-xs font-mono text-stone-300">
            <span>{formatTime(currentTime)}</span>
            <span className="text-stone-500 mx-1">/</span>
            <span className="text-stone-400">{formatTime(duration || audioFeatures?.duration || 0)}</span>
          </div>
        </div>

        <button
          onClick={onReAnalyze}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 active:scale-95 text-amber-300 text-xs font-semibold transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{isProcessing ? 'در حال تحلیل...' : 'تحلیل مجدد با مدل'}</span>
        </button>
      </div>
    </div>
  );
};
