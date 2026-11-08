import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Upload, 
  BrainCircuit, 
  BookOpen, 
  FileAudio, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { PushToTalkButton } from './components/PushToTalkButton';
import { AudioPlayerWaveform } from './components/AudioPlayerWaveform';
import { ResultCard } from './components/ResultCard';
import { ModelUploaderModal } from './components/ModelUploaderModal';
import { MetersDirectoryModal } from './components/MetersDirectoryModal';
import { SampleAudioSelector } from './components/SampleAudioSelector';
import { 
  H5ModelSummary, 
  PredictionResult, 
  DEFAULT_DEMO_MODEL, 
  runModelInference 
} from './services/h5Parser';
import { 
  decodeAndExtractFeatures, 
  ExtractedAudioFeatures, 
  createSyntheticPoemAudio 
} from './services/audioProcessor';
import { getMeterByCode } from './data/meters';

export default function App() {
  // مدل H5 فعال
  const [model, setModel] = useState<H5ModelSummary>(DEFAULT_DEMO_MODEL);
  
  // مدال‌ها و تب‌های فعال
  const [activeTab, setActiveTab] = useState<'recognizer' | 'model' | 'directory'>('recognizer');
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState(false);

  // وضعیت صوت بارگذاری‌شده
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [audioFeatures, setAudioFeatures] = useState<ExtractedAudioFeatures | null>(null);

  // وضعیت پردازش هوش مصنوعی
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [serverProsody, setServerProsody] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const audioFileInputRef = useRef<HTMLInputElement | null>(null);

  // پردازش فایل صوتی ضبط‌شده یا آپلود‌شده با مدل H5
  const processAudioPipeline = async (blob: Blob, url: string, customName?: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setPredictionResult(null);
    setServerProsody(null);
    setAudioBlob(blob);
    setAudioUrl(url);
    if (customName) setAudioFileName(customName);

    try {
      // مرحله 1: کدبرداری و استخراج ویژگی‌های صوتی
      setProcessingStep('در حال کدبرداری موج صوتی و تبدیل به باندهای فرکانسی (Mel)...');
      const { features } = await decodeAndExtractFeatures(blob);
      setAudioFeatures(features);

      // مرحله 2: ارزیابی در مدل هوش مصنوعی H5
      setProcessingStep('در حال اجرای مدل هوش مصنوعی H5 و طبقه‌بندی وزن شعر...');
      await new Promise(r => setTimeout(r, 600)); // حس روانی پردازش شبکه عصبی
      const prediction = await runModelInference(model, features);
      setPredictionResult(prediction);

      // مرحله 3: تطبیق زبانی و عروضی تکمیلی با سرور در صورت امکان
      setProcessingStep('تطبیق کد پوشه با اوزان عروضی فارسی و استخراج ارکان...');
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            resolve(base64String || '');
          };
          reader.readAsDataURL(blob);
        });
        const base64Audio = await base64Promise;

        fetch('/api/analyze-prosody', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: blob.type || 'audio/webm',
            detectedCode: prediction.topFolderCode,
          }),
        })
          .then(res => res.json())
          .then(data => {
            if (data?.available) {
              setServerProsody(data);
            }
          })
          .catch(() => {});
      } catch {
        // اختیاری است
      }

      // آتش‌بازی جذاب پیروزی تشخیص وزن
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.65 },
          colors: ['#f59e0b', '#d97706', '#ef4444', '#10b981'],
        });
      } catch {
        // نادیده گرفتن
      }

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'خطا در پردازش فایل صوتی. لطفاً فایل صوتی دیگری را امتحان کنید.');
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  // دریافت صدا از دکمه قرمز مرکزی (Push-to-Talk)
  const handleAudioRecorded = (blob: Blob, url: string) => {
    setAudioFileName('دکلمه ضبط شده با میکروفون');
    processAudioPipeline(blob, url, 'دکلمه ضبط شده با میکروفون');
  };

  // انتخاب فایل صوتی ذخیره شده از گوشی یا کامپیوتر
  const handleAudioFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setAudioFileName(file.name);
    processAudioPipeline(file, url, file.name);
  };

  // انتخاب یکی از نمونه‌های پیش‌فرض جهت تست فوری
  const handleSelectSample = (code: number, title: string) => {
    const sample = createSyntheticPoemAudio(code);
    setAudioFileName(title);
    processAudioPipeline(sample.blob, sample.url, title);
  };

  // بازنشانی و پاک کردن صوت جاری
  const handleClearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBlob(null);
    setAudioFeatures(null);
    setPredictionResult(null);
    setServerProsody(null);
    setAudioFileName(null);
    setErrorMessage(null);
  };

  // تحلیل مجدد صوت فعلی با مدل تغییر یافته
  const handleReAnalyze = () => {
    if (audioBlob && audioUrl) {
      processAudioPipeline(audioBlob, audioUrl, audioFileName || undefined);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-600/30 selection:text-amber-200">
      
      {/* 1. ناوبری و منوی بالا بر اساس استاندارد ۳ منطقه‌ای */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'model') setIsModelModalOpen(true);
          if (tab === 'directory') setIsDirectoryModalOpen(true);
        }}
        isCustomModelLoaded={model.isCustomLoaded}
        modelName={model.name}
        onOpenModelModal={() => setIsModelModalOpen(true)}
      />

      {/* 2. بدنه اصلی اپلیکیشن */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* کادر اعلان وضعیت مدل فعال */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-stone-900/70 border border-stone-800 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <div className={`w-3 h-3 rounded-full ${model.isCustomLoaded ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-stone-400">مدل فعال:</span>
              <span className="font-semibold text-stone-200">{model.name}</span>
              <span className="text-stone-400 hidden sm:inline">({model.outputUnits} کلاس وزن)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModelModalOpen(true)}
              className="text-amber-400 hover:text-amber-300 font-medium hover:underline text-xs flex items-center gap-1"
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span>{model.isCustomLoaded ? 'مشاهده جزئیات مدل' : 'آپلود مدل اختصاصی H5'}</span>
            </button>
            <span className="text-stone-600">·</span>
            <button
              onClick={() => setIsDirectoryModalOpen(true)}
              className="text-stone-400 hover:text-stone-200 text-xs hover:underline flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>کدهای عروضی</span>
            </button>
          </div>
        </div>

        {/* خطای احتمالی */}
        {errorMessage && (
          <div className="p-4 bg-red-950/80 border border-red-800 rounded-2xl text-red-200 text-xs sm:text-sm flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
            <div>
              <p className="font-bold mb-1">خطا در پردازش</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* استیج ورود صدا: دکمه قرمز مرکزی و انتخاب فایل صوتی از گوشی */}
        <div className="bg-gradient-to-b from-stone-900/90 to-stone-900/40 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          <div className="text-center max-w-xl mx-auto mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-stone-100 tracking-tight mb-2">
              ورود صدای دکلمه یا خوانش شعر
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">
              صدای یک یا دو بیت از شعر را ضبط کرده یا فایل صوتی ذخیره‌شده را از حافظه گوشی انتخاب کنید تا وزن آن مطابق مدل H5 تشخیص داده شود.
            </p>
          </div>

          {/* محفظه دکمه قرمز ضبط صدا با فشردن و نگه‌داشتن */}
          <div className="bg-stone-950/60 border border-stone-800/80 rounded-2xl p-6 mb-6">
            <PushToTalkButton
              onAudioRecorded={handleAudioRecorded}
              isProcessing={isProcessing}
            />
          </div>

          {/* روش دوم: انتخاب فایل صوتی ذخیره‌شده از گوشی کاربر */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 text-center">
            <input
              ref={audioFileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac,.aac"
              onChange={handleAudioFileSelect}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => audioFileInputRef.current?.click()}
              disabled={isProcessing}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 active:scale-98 text-stone-200 text-xs sm:text-sm font-semibold transition-all border border-stone-700/60 shadow-md cursor-pointer disabled:opacity-50"
            >
              <FileAudio className="w-4 h-4 text-amber-400" />
              <span>انتخاب فایل صوتی ذخیره شده از گوشی / رایانه</span>
            </button>

            <span className="text-stone-400 text-xs hidden sm:inline">
              (پشتیبانی از MP3, WAV, M4A, OGG)
            </span>
          </div>

        </div>

        {/* وضعیت لودینگ و نمایش مراحل گام‌به‌گام پردازش هوش مصنوعی */}
        {isProcessing && (
          <div className="bg-stone-900 border border-amber-500/40 rounded-2xl p-6 text-center shadow-xl space-y-3 animate-pulse">
            <div className="w-10 h-10 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <h3 className="text-sm font-bold text-amber-400">
              در حال پردازش و ارزیابی عروضی...
            </h3>
            <p className="text-xs text-stone-300 font-mono">
              {processingStep || 'در حال تحلیل...'}
            </p>
          </div>
        )}

        {/* پخش‌کننده و شکل‌موج صوتی فایل در صورت وجود */}
        {audioUrl && !isProcessing && (
          <AudioPlayerWaveform
            audioUrl={audioUrl}
            audioFeatures={audioFeatures}
            fileName={audioFileName || undefined}
            onClearAudio={handleClearAudio}
            onReAnalyze={handleReAnalyze}
            isProcessing={isProcessing}
          />
        )}

        {/* ۳. کارت نتیجه تشخیص وزن شعر فارسی */}
        {predictionResult && !isProcessing && (
          <ResultCard
            prediction={predictionResult}
            modelName={model.name}
            isCustomModel={model.isCustomLoaded}
            serverProsodyAnalysis={serverProsody}
          />
        )}

        {/* ۴. سلکتور نمونه‌های صوتی جهت تست سریع */}
        <SampleAudioSelector
          onSelectSample={handleSelectSample}
          isProcessing={isProcessing}
        />

        {/* راهنما و نکات عروضی */}
        <div className="p-5 rounded-2xl bg-stone-900/40 border border-stone-800 text-xs text-stone-400 space-y-2">
          <div className="flex items-center gap-2 text-stone-300 font-bold">
            <HelpCircle className="w-4 h-4 text-amber-500" />
            <span>راهنمای خوانش بهتر شعر برای افزایش دقت مدل هوش مصنوعی:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pr-1 text-stone-400 leading-relaxed">
            <li>شعر را با وزن طبیعی، تکیه‌های وزنی روان و بدون مکث‌های طولانی غیرعادی بخوانید.</li>
            <li>خواندن حداقل یک بیت کامل (دو مصراع) دقت مدل را در تشخیص تکرار افاعیل عروضی بالا می‌برد.</li>
            <li>در صورتی که مدل H5 اختصاصی خود را آموزش داده‌اید، از دکمه «آپلود مدل H5» در بالای صفحه استفاده کنید؛ برنامه به طور خودکار لایه‌ها و کدهای پوشه شما را تطبیق می‌دهد.</li>
          </ul>
        </div>

      </main>

      {/* ۵. فوتر مینیمال */}
      <footer className="border-t border-stone-900 bg-stone-950/80 py-6 text-center text-xs text-stone-400">
        <p>سامانه هوشمند تشخیص و تقطیع وزن شعر فارسی بر پایه هوش مصنوعی و عروض سنتی</p>
      </footer>

      {/* مدال آپلود و مدیریت مدل H5 */}
      <ModelUploaderModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        currentModel={model}
        onModelLoaded={(newModel) => {
          setModel(newModel);
        }}
        onResetToDefault={() => {
          setModel(DEFAULT_DEMO_MODEL);
        }}
      />

      {/* مدال فهرست کامل اوزان عروضی و کدهای پوشه */}
      <MetersDirectoryModal
        isOpen={isDirectoryModalOpen}
        onClose={() => setIsDirectoryModalOpen(false)}
        onSelectMeterTest={(code) => {
          const sample = createSyntheticPoemAudio(code);
          processAudioPipeline(sample.blob, sample.url, `آزمایش وزن پوشه ${code}`);
        }}
      />

    </div>
  );
}
