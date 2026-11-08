import React from 'react';
import { Music, PlayCircle, Sparkles } from 'lucide-react';

interface SampleAudioSelectorProps {
  onSelectSample: (code: number, title: string) => void;
  isProcessing: boolean;
}

export const SampleAudioSelector: React.FC<SampleAudioSelectorProps> = ({
  onSelectSample,
  isProcessing,
}) => {
  const samples = [
    {
      code: 81,
      poet: 'حافظ شیرازی',
      verse: 'ای فروغ ماه حسن از روی رخشان شما...',
      meter: 'فاعلاتن فاعلاتن فاعلاتن فاعلن (کد ۸۱)',
      style: 'رمل مثمن محذوف',
    },
    {
      code: 332,
      poet: 'فردوسی توسی',
      verse: 'به نام خداوند جان و خرد...',
      meter: 'فعولن فاعلن فعولن فاعلن (کد ۳۳۲)',
      style: 'وزن شاهنامه (متقارب)',
    },
    {
      code: 295,
      poet: 'مولانا',
      verse: 'بشنو این نی چون شکایت می‌کند...',
      meter: 'فاعلاتن فاعلاتن فاعلن (کد ۲۹۵)',
      style: 'وزن مثنوی معنوی (رمل)',
    },
    {
      code: 118,
      poet: 'سعدی شیرازی',
      verse: 'ای ساربان آهسته ران کارام جانم می‌رود...',
      meter: 'مفعول مفاعیلن مفعول فعولن (کد ۱۱۸)',
      style: 'هزج مثمن اخرب',
    },
    {
      code: 279,
      poet: 'خیام نیشابوری',
      verse: 'این کوزه چو من عاشق زاری بوده است...',
      meter: 'مفعول مفاعیل مفاعیل فعل (کد ۲۷۹)',
      style: 'وزن رباعیات خیام',
    },
    {
      code: 290,
      poet: 'باباطاهر عریان',
      verse: 'ز دست دیده و دل هر دو فریاد...',
      meter: 'مفاعیلن مفاعیلن فعولن (کد ۲۹۰)',
      style: 'وزن دوبیتی‌های اصیل',
    },
  ];

  return (
    <div className="bg-stone-900/60 border border-stone-800/80 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs sm:text-sm font-bold text-stone-200">
            یا نمونه‌های پیش‌فرض دکلمه شعر را برای تست فوری انتخاب کنید:
          </h3>
        </div>
        <span className="text-[11px] text-stone-400 hidden sm:inline">
          آزمایش سریع دقت مدل
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {samples.map((sample) => (
          <button
            key={sample.code}
            disabled={isProcessing}
            onClick={() => onSelectSample(sample.code, `${sample.poet} - ${sample.verse}`)}
            className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-950/70 hover:bg-stone-950 border border-stone-800/80 hover:border-amber-500/50 text-right transition-all group disabled:opacity-50"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <PlayCircle className="w-4 h-4" />
            </div>

            <div className="truncate w-full">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-stone-200 group-hover:text-amber-300 transition-colors">
                  {sample.poet}
                </span>
                <span className="text-[10px] font-mono text-stone-400 bg-stone-900 px-1.5 py-0.5 rounded">
                  کد {sample.code}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 truncate mt-0.5 font-serif">
                «{sample.verse}»
              </p>
              <span className="text-[10px] text-amber-400/80 block mt-1">
                {sample.style}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
