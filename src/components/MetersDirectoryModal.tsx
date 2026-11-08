import React, { useState, useMemo } from 'react';
import { Search, BookOpen, Hash, X, ExternalLink, Music } from 'lucide-react';
import { FOLDER_METERS, getMeterByCode } from '../data/meters';

interface MetersDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMeterTest?: (code: number) => void;
}

export const MetersDirectoryModal: React.FC<MetersDirectoryModalProps> = ({
  isOpen,
  onClose,
  onSelectMeterTest,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBahrFilter, setSelectedBahrFilter] = useState<string>('all');

  const allMeters = useMemo(() => {
    return Object.keys(FOLDER_METERS)
      .map(Number)
      .sort((a, b) => a - b)
      .map(code => getMeterByCode(code));
  }, []);

  const filteredMeters = useMemo(() => {
    return allMeters.filter(item => {
      const matchSearch =
        searchQuery.trim() === '' ||
        item.code.toString().includes(searchQuery.trim()) ||
        item.pattern.includes(searchQuery.trim()) ||
        (item.bahr && item.bahr.includes(searchQuery.trim())) ||
        (item.example && (item.example.verse1.includes(searchQuery.trim()) || item.example.poet.includes(searchQuery.trim())));

      const matchFilter =
        selectedBahrFilter === 'all' ||
        (selectedBahrFilter === 'ramal' && (item.pattern.includes('فاعلاتن') || item.pattern.includes('فعلاتن'))) ||
        (selectedBahrFilter === 'hazaj' && item.pattern.includes('مفاعیلن')) ||
        (selectedBahrFilter === 'motaqareb' && item.pattern.includes('فعولن')) ||
        (selectedBahrFilter === 'rajaz' && item.pattern.includes('مستفعلن')) ||
        (selectedBahrFilter === 'famous' && item.example !== undefined);

      return matchSearch && matchFilter;
    });
  }, [allMeters, searchQuery, selectedBahrFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* هدر مدال */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between gap-4 bg-stone-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">
                فهرست معادل‌های وزن شعر و کدهای پوشه
              </h2>
              <p className="text-xs text-stone-400">
                مجموعه ۹۵+ وزن شعر فارسی ثبت‌شده در مدل هوش مصنوعی
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* فیلترها و کادر جستجو */}
        <div className="p-4 sm:p-6 border-b border-stone-800 bg-stone-950/40 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو با کد پوشه (مثلاً 81 یا 332) یا ارکان عروضی (فاعلاتن، هزج، شاهنامه...)"
              className="w-full pl-4 pr-10 py-2.5 bg-stone-900 border border-stone-700/80 rounded-xl text-stone-100 placeholder-stone-500 text-xs sm:text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* تب‌های دسته‌بندی */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedBahrFilter('all')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedBahrFilter === 'all'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'bg-stone-800/80 text-stone-300 hover:bg-stone-800'
              }`}
            >
              همه اوزان ({allMeters.length})
            </button>
            <button
              onClick={() => setSelectedBahrFilter('famous')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedBahrFilter === 'famous'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'bg-stone-800/80 text-stone-300 hover:bg-stone-800'
              }`}
            >
              اوزان شاخص و معروف با نمونه شعر
            </button>
            <button
              onClick={() => setSelectedBahrFilter('ramal')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedBahrFilter === 'ramal'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'bg-stone-800/80 text-stone-300 hover:bg-stone-800'
              }`}
            >
              بحر رمل (فاعلاتن / فعلاتن)
            </button>
            <button
              onClick={() => setSelectedBahrFilter('hazaj')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedBahrFilter === 'hazaj'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'bg-stone-800/80 text-stone-300 hover:bg-stone-800'
              }`}
            >
              بحر هزج (مفاعیلن)
            </button>
            <button
              onClick={() => setSelectedBahrFilter('motaqareb')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedBahrFilter === 'motaqareb'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'bg-stone-800/80 text-stone-300 hover:bg-stone-800'
              }`}
            >
              بحر متقارب (فعولن)
            </button>
            <button
              onClick={() => setSelectedBahrFilter('rajaz')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedBahrFilter === 'rajaz'
                  ? 'bg-amber-500 text-stone-950 font-bold'
                  : 'bg-stone-800/80 text-stone-300 hover:bg-stone-800'
              }`}
            >
              بحر رجز (مستفعلن)
            </button>
          </div>
        </div>

        {/* لیست اوزان عروضی */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3">
          {filteredMeters.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-xs sm:text-sm">
              هیچ وزنی با عبارت جستجو یافت نشد.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredMeters.map((item) => (
                <div
                  key={item.code}
                  className="bg-stone-950/70 border border-stone-800 hover:border-amber-500/50 rounded-xl p-4 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-stone-800/60">
                      <div className="flex items-center gap-1.5 text-amber-400 font-mono font-bold text-xs sm:text-sm">
                        <Hash className="w-3.5 h-3.5 text-amber-500" />
                        <span>پوشه {item.code}</span>
                      </div>
                      {item.bahr && (
                        <span className="text-[11px] text-stone-400">
                          {item.bahr}
                        </span>
                      )}
                    </div>

                    <div className="text-sm sm:text-base font-bold text-stone-100 group-hover:text-amber-300 transition-colors mb-2">
                      {item.pattern}
                    </div>

                    {item.syllables && (
                      <div className="text-[11px] font-mono text-stone-400 bg-stone-900 px-2 py-0.5 rounded dir-ltr text-left inline-block mb-2">
                        {item.syllables}
                      </div>
                    )}

                    {item.example && (
                      <div className="text-[11px] text-stone-400 italic bg-amber-950/20 p-2 rounded border border-amber-900/30 my-1">
                        <span className="text-amber-400 font-semibold block mb-0.5">{item.example.poet}:</span>
                        <span>« {item.example.verse1} »</span>
                      </div>
                    )}
                  </div>

                  {onSelectMeterTest && (
                    <div className="pt-2 mt-2 border-t border-stone-800/60 flex justify-end">
                      <button
                        onClick={() => {
                          onSelectMeterTest(item.code);
                          onClose();
                        }}
                        className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:underline"
                      >
                        <Music className="w-3 h-3" />
                        <span>تست صوتی این وزن</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* فوتر مدال */}
        <div className="px-6 py-3 border-t border-stone-800 flex items-center justify-between bg-stone-950/70 text-xs text-stone-400">
          <span>نمایش {filteredMeters.length} از {allMeters.length} وزن</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-200 bg-stone-800 hover:bg-stone-700 rounded-xl transition-colors"
          >
            بستن
          </button>
        </div>

      </div>
    </div>
  );
};
