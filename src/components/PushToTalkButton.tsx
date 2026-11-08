import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Radio, Square, AlertCircle } from 'lucide-react';
import { AudioRecorderManager } from '../services/audioProcessor';

interface PushToTalkButtonProps {
  onAudioRecorded: (blob: Blob, audioUrl: string) => void;
  isProcessing: boolean;
}

export const PushToTalkButton: React.FC<PushToTalkButtonProps> = ({
  onAudioRecorded,
  isProcessing,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [micFrequencyData, setMicFrequencyData] = useState<number[]>(new Array(16).fill(10));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recorderRef = useRef<AudioRecorderManager | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const isMouseDownRef = useRef<boolean>(false);

  // تمیز کردن رفرش‌ها
  useEffect(() => {
    recorderRef.current = new AudioRecorderManager();
    return () => {
      if (recorderRef.current) {
        recorderRef.current.cancel();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // شروع ضبط هنگام لمس/کلیک و نگه داشتن
  const handleStartRecording = useCallback(async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (isProcessing || isRecording) return;

    setErrorMessage(null);
    isMouseDownRef.current = true;

    // لرزش حسی گوشی (Haptic feedback)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(40);
      } catch {
        // نادیده گرفتن در صورت عدم پشتیبانی
      }
    }

    try {
      if (!recorderRef.current) {
        recorderRef.current = new AudioRecorderManager();
      }

      await recorderRef.current.start((freqData) => {
        // انتخاب 16 نمونه فرکانسی برای میله‌های موج
        const samples: number[] = [];
        const step = Math.max(1, Math.floor(freqData.length / 16));
        for (let i = 0; i < 16; i++) {
          const val = freqData[i * step] || 0;
          samples.push(Math.max(12, (val / 255) * 64));
        }
        setMicFrequencyData(samples);
      });

      setIsRecording(true);
      startTimeRef.current = Date.now();
      setRecordSeconds(0);

      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setRecordSeconds(elapsed);
      }, 200);
    } catch (err: any) {
      isMouseDownRef.current = false;
      setIsRecording(false);
      setErrorMessage(err?.message || 'خطا در دسترسی به میکروفون.');
    }
  }, [isProcessing, isRecording]);

  // اتمام ضبط هنگام برداشتن انگشت
  const handleStopRecording = useCallback(async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!isMouseDownRef.current && !isRecording) return;

    isMouseDownRef.current = false;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (!recorderRef.current || !isRecording) {
      setIsRecording(false);
      return;
    }

    const duration = (Date.now() - startTimeRef.current) / 1000;

    // لرزش حسی پایان ضبط
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([30, 40, 30]);
      } catch {
        // نادیده گرفتن
      }
    }

    setIsRecording(false);
    setMicFrequencyData(new Array(16).fill(10));

    // اگر ضبط کمتر از 0.8 ثانیه باشد هشدار دهیم
    if (duration < 0.7) {
      recorderRef.current.cancel();
      setErrorMessage('زمان ضبط بسیار کوتاه بود. دکمه را فشار دهید و در طول خواندن شعر نگه دارید.');
      return;
    }

    try {
      const result = await recorderRef.current.stop();
      onAudioRecorded(result.blob, result.url);
    } catch (err: any) {
      setErrorMessage(err?.message || 'خطا در استخراج فایل صوتی ضبط شده.');
    }
  }, [isRecording, onAudioRecorded]);

  // لغو در صورت خروج نشانگر به بیرون با ایمنی
  const handlePointerLeave = useCallback(() => {
    if (isRecording) {
      handleStopRecording();
    }
  }, [isRecording, handleStopRecording]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center select-none py-4">
      {/* دکمه قرمز مرکزی با قابلیت فشردن و نگه‌داشتن */}
      <div className="relative flex items-center justify-center">
        
        {/* هاله امواج تپنده به هنگام نگه داشتن دکمه */}
        {isRecording && (
          <div className="absolute inset-0 -m-6 rounded-full bg-red-600/20 animate-ping pointer-events-none" />
        )}
        {isRecording && (
          <div className="absolute inset-0 -m-3 rounded-full bg-red-500/30 animate-pulse pointer-events-none" />
        )}

        <button
          type="button"
          onPointerDown={handleStartRecording}
          onPointerUp={handleStopRecording}
          onPointerCancel={handleStopRecording}
          onPointerLeave={handlePointerLeave}
          disabled={isProcessing}
          aria-label="دکمه قرمز ضبط صدا با فشردن و نگه‌داشتن"
          className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center transition-all duration-200 shadow-2xl touch-none outline-none select-none ${
            isProcessing
              ? 'bg-stone-800 text-stone-500 cursor-not-allowed opacity-60'
              : isRecording
              ? 'bg-gradient-to-br from-red-500 via-red-600 to-rose-700 text-white scale-105 shadow-red-500/50 ring-4 ring-red-400/80 animate-record-ripple'
              : 'bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white shadow-red-600/40 hover:shadow-red-500/60 active:scale-95 cursor-pointer'
          }`}
        >
          {isRecording ? (
            <div className="flex flex-col items-center">
              <Square className="w-8 h-8 fill-current mb-1" />
              <span className="text-[11px] font-bold tracking-tight">رها کنید</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Mic className="w-9 h-9 sm:w-10 sm:h-10 mb-1 drop-shadow" />
              <span className="text-[11px] sm:text-xs font-bold tracking-tight">نگه دارید</span>
            </div>
          )}
        </button>
      </div>

      {/* وضعیت و راهنمای کاربری زیر دکمه */}
      <div className="mt-4 text-center">
        {isRecording ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-red-400 font-bold text-sm sm:text-base animate-pulse">
              <Radio className="w-4 h-4 text-red-500 animate-spin" />
              <span>در حال ضبط صدا... {formatTimer(recordSeconds)}</span>
            </div>
            
            {/* نمایشگر میله‌ای زنده امواج صدای خوانش شعر */}
            <div className="flex items-end justify-center gap-1 h-10 px-4 py-1 bg-stone-900/80 rounded-xl border border-red-900/40 shadow-inner">
              {micFrequencyData.map((height, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-gradient-to-t from-red-600 to-rose-400 rounded-full transition-all duration-75"
                  style={{ height: `${height}px` }}
                />
              ))}
            </div>

            <p className="text-xs text-stone-300 font-medium">
              شعر را بخوانید و پس از اتمام بیت، انگشت خود را بردارید تا پردازش آغاز شود.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm font-semibold text-stone-200">
              دکمه قرمز را <span className="text-red-400 underline decoration-red-500/40">فشار دهید و نگه دارید</span>
            </p>
            <p className="text-xs text-stone-400 max-w-sm">
              با برداشتن انگشت از روی دکمه، فایل صوتی دریافت و بلافاصله توسط مدل هوش مصنوعی پردازش خواهد شد.
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="mt-3 p-2.5 max-w-md mx-auto bg-red-950/70 border border-red-800 text-red-200 text-xs rounded-xl flex items-center gap-2 text-right">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
