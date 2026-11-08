import React, { useState } from 'react';
import { Award, Check, Copy, BookOpen, Quote, ChevronDown, ChevronUp, Cpu, Volume2, Sparkles } from 'lucide-react';
import { PredictionResult } from '../services/h5Parser';

interface ResultCardProps {
  prediction: PredictionResult;
  modelName: string;
  isCustomModel: boolean;
  serverProsodyAnalysis?: any;
}

export const ResultCard: React.FC<ResultCardProps> = ({
  prediction,
  modelName,
  isCustomModel,
  serverProsodyAnalysis,
}) => {
  const [copied, setCopied] = useState(false);
  const [showAllCandidates, setShowAllCandidates] = useState(false);

  const { topMeter, topFolderCode, confidence, allPredictions, featuresExtracted } = prediction;

  const handleCopy = () => {
    const textToCopy = `کد پوشه: ${topFolderCode}\nوزن عروضی: ${topMeter.pattern}\nنام بحر: ${topMeter.bahr || 'نامشخص'}\nتقطیع هجایی: ${topMeter.syllables || ''}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const confidencePercent = Math.round(confidence * 100);

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden shadow-2xl transition-all">
      {/* سربرگ نتیجه با اعلام مدل و اطمینان */}
      <div className="bg-gradient-to-l from-amber-950/40 via-stone-900 to-stone-900 px-6 py-4 border-b border-stone-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-amber-400 block">
              نتیجه پردازش وزن شعر فارسی
            </span>
            <div className="flex items-center gap-2 text-[11px] text-stone-400">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-stone-400" />
                <span>مدل: {isCustomModel ? 'مدل H5 شما' : 'مدل پیش‌فرض سامانه'}</span>
              </span>
              <span>·</span>
              <span className="text-stone-300 truncate max-w-[180px] sm:max-w-xs">{modelName}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* نشانگر درصد اطمینان مدل */}
          <div className="flex items-center gap-2 px-3 py-1 bg-stone-950/80 rounded-lg border border-stone-800 text-xs font-medium text-stone-300">
            <span>درصد اطمینان:</span>
            <span className="font-bold text-amber-400 font-mono">{confidencePercent}%</span>
          </div>

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors"
            title="کپی نتیجه وزن"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* بخش اصلی نمایش متن وزن شعر */}
      <div className="p-6 sm:p-8 space-y-6">
        
        {/* کد پوشه آموزشی و عنوان وزن */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 pb-4 border-b border-stone-800/60">
          <div>
            <span className="text-xs text-stone-400 font-medium">کد پوشه در مدل هوش مصنوعی:</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tracking-tight mt-0.5">
              پوشه شماره {topFolderCode}
            </div>
          </div>

          {topMeter.bahr && (
            <div className="text-sm font-semibold text-stone-300 bg-stone-950 px-3 py-1.5 rounded-lg border border-stone-800 inline-flex items-center gap-1.5 self-start sm:self-auto">
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span>{topMeter.bahr}</span>
            </div>
          )}
        </div>

        {/* ارکان عروضی وزن به صورت متن برجسته فارسی */}
        <div className="bg-stone-950/70 rounded-xl p-5 border border-stone-800/80 relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-amber-500/0 via-amber-500 to-amber-500/0" />
          
          <span className="text-xs font-medium text-stone-400 block mb-2">
            ارکان و افاعیل عروضی (تقطیع هجایی):
          </span>
          
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-stone-100 leading-relaxed font-sans">
            {topMeter.pattern}
          </div>

          {/* الگوی نشانه‌ای هجاها (علامت‌های هجای کوتاه و بلند) */}
          {topMeter.syllables && (
            <div className="mt-4 pt-3 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-stone-400">
                <span className="font-semibold text-stone-300">الگوی هجاها:</span>
                <span className="font-mono text-amber-300 tracking-wider text-sm bg-stone-900 px-2.5 py-1 rounded border border-stone-800 dir-ltr text-left">
                  {topMeter.syllables}
                </span>
              </div>
              <div className="text-[11px] text-stone-400">
                ( <span className="font-mono text-amber-300">—</span> هجای بلند · <span className="font-mono text-amber-300">U</span> هجای کوتاه )
              </div>
            </div>
          )}
        </div>

        {/* نمونه شعر ماندگار در این وزن در صورت وجود */}
        {topMeter.example && (
          <div className="bg-amber-950/15 border border-amber-900/30 rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-2">
              <Quote className="w-4 h-4" />
              <span>نمونه شعر مشهور در این وزن ({topMeter.example.poet}):</span>
            </div>
            
            <div className="space-y-1 text-center py-2 text-stone-200 font-serif text-sm sm:text-base leading-relaxed">
              <p>« {topMeter.example.verse1} »</p>
              <p>« {topMeter.example.verse2} »</p>
            </div>
          </div>
        )}

        {/* متن شعر خوانده شده از طریق تحلیل عروضی زبانی (در صورت فعال بودن) */}
        {serverProsodyAnalysis?.available && serverProsodyAnalysis.analysis?.transcribedVerses && (
          <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>متن استخراج شده از صوت و تطبیق زبانی:</span>
            </div>
            {Array.isArray(serverProsodyAnalysis.analysis.transcribedVerses) && (
              <div className="text-stone-300 italic space-y-1 pr-2 border-r-2 border-amber-500">
                {serverProsodyAnalysis.analysis.transcribedVerses.map((v: string, i: number) => (
                  <p key={i}>« {v} »</p>
                ))}
              </div>
            )}
            {serverProsodyAnalysis.analysis.notes && (
              <p className="text-stone-400 text-[11px] pt-1">
                توضیحات عروضی: {serverProsodyAnalysis.analysis.notes}
              </p>
            )}
          </div>
        )}

        {/* ویژگی‌های فیزیکی استخراج شده از صوت */}
        {featuresExtracted && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-2.5 rounded-lg bg-stone-950/60 border border-stone-800">
              <span className="text-stone-400 block text-[11px]">تندا / ضرباهنگ</span>
              <span className="font-bold text-stone-200 font-mono mt-0.5 block">{featuresExtracted.tempoBpm} BPM</span>
            </div>
            <div className="p-2.5 rounded-lg bg-stone-950/60 border border-stone-800">
              <span className="text-stone-400 block text-[11px]">طول فایل صوتی</span>
              <span className="font-bold text-stone-200 font-mono mt-0.5 block">{featuresExtracted.durationSec} ثانیه</span>
            </div>
            <div className="p-2.5 rounded-lg bg-stone-950/60 border border-stone-800">
              <span className="text-stone-400 block text-[11px]">فرکانس پایه غالب</span>
              <span className="font-bold text-stone-200 font-mono mt-0.5 block">{featuresExtracted.dominantFreqHz} هرتز</span>
            </div>
            <div className="p-2.5 rounded-lg bg-stone-950/60 border border-stone-800">
              <span className="text-stone-400 block text-[11px]">انتظام ریتم هجایی</span>
              <span className="font-bold text-stone-200 font-mono mt-0.5 block">{Math.round(featuresExtracted.syllableRhythmScore * 100)}%</span>
            </div>
          </div>
        )}

        {/* سایر اوزان محتمل (۵ رتبه برتر طبقه‌بندی) */}
        {allPredictions.length > 1 && (
          <div className="pt-2">
            <button
              onClick={() => setShowAllCandidates(!showAllCandidates)}
              className="w-full flex items-center justify-between text-xs font-medium text-stone-400 hover:text-stone-200 py-2 border-t border-stone-800 transition-colors"
            >
              <span>سایر اوزان محتمل در مدل طبقه‌بندی ({allPredictions.length} وزن برتر)</span>
              {showAllCandidates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAllCandidates && (
              <div className="mt-2 space-y-2">
                {allPredictions.slice(1, 6).map((item, idx) => {
                  const prob = Math.round(item.probability * 100);
                  return (
                    <div
                      key={item.folderCode}
                      className="p-3 bg-stone-950/60 rounded-lg border border-stone-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-stone-400 w-5 text-center shrink-0">#{idx + 2}</span>
                        <span className="text-amber-400/90 font-mono shrink-0">کد {item.folderCode}:</span>
                        <span className="text-stone-200 truncate font-medium">{item.meter.pattern}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-16 h-1.5 bg-stone-800 rounded-full overflow-hidden hidden sm:block">
                          <div className="h-full bg-amber-500/70 rounded-full" style={{ width: `${prob}%` }} />
                        </div>
                        <span className="font-mono text-stone-400 text-[11px] w-8 text-left">{prob}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
