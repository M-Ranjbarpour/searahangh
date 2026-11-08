import React from 'react';
import { Sparkles, BrainCircuit, BookOpen, Upload, Volume2 } from 'lucide-react';

interface NavbarProps {
  activeTab: 'recognizer' | 'model' | 'directory';
  setActiveTab: (tab: 'recognizer' | 'model' | 'directory') => void;
  isCustomModelLoaded: boolean;
  modelName: string;
  onOpenModelModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isCustomModelLoaded,
  modelName,
  onOpenModelModal,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-stone-950/85 backdrop-blur-md border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 md:gap-8">
        
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-stone-950 shadow-md shadow-amber-500/20">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-stone-100 whitespace-nowrap">
              سامانه هوشمند تشخیص وزن شعر
            </h1>
            <p className="text-[11px] text-stone-400 hidden sm:block">
              عروض‌سنج صوتی با مدل عصبی H5
            </p>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-2 lg:gap-4 text-sm font-medium">
          <button
            onClick={() => setActiveTab('recognizer')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'recognizer'
                ? 'bg-stone-800 text-amber-400 font-semibold'
                : 'text-stone-300 hover:text-stone-100 hover:bg-stone-900'
            }`}
          >
            تشخیص وزن
          </button>

          <button
            onClick={() => setActiveTab('model')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'model'
                ? 'bg-stone-800 text-amber-400 font-semibold'
                : 'text-stone-300 hover:text-stone-100 hover:bg-stone-900'
            }`}
          >
            <BrainCircuit className="w-4 h-4 text-amber-500" />
            <span>مدل هوش مصنوعی (H5)</span>
            {isCustomModelLoaded && (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'directory'
                ? 'bg-stone-800 text-amber-400 font-semibold'
                : 'text-stone-300 hover:text-stone-100 hover:bg-stone-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-stone-400" />
            <span>جدول اوزان عروضی (۹۵+ وزن)</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenModelModal}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-stone-950 bg-amber-400 hover:bg-amber-300 active:scale-[0.98] rounded-xl transition-all shadow-md shadow-amber-500/10 whitespace-nowrap"
            title={modelName}
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isCustomModelLoaded ? 'تغییر مدل H5' : 'آپلود مدل H5'}
            </span>
            <span className="sm:hidden">مدل H5</span>
          </button>
        </div>

      </div>
    </header>
  );
};
