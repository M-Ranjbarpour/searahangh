import React, { useState, useRef } from 'react';
import { Upload, BrainCircuit, CheckCircle2, AlertTriangle, Layers, Database, FileCode, X, RefreshCw, Cpu, HelpCircle } from 'lucide-react';
import { H5ModelSummary, parseH5ModelFile, DEFAULT_DEMO_MODEL } from '../services/h5Parser';

interface ModelUploaderModalProps {
  currentModel: H5ModelSummary;
  onModelLoaded: (model: H5ModelSummary) => void;
  onResetToDefault: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ModelUploaderModal: React.FC<ModelUploaderModalProps> = ({
  currentModel,
  onModelLoaded,
  onResetToDefault,
  isOpen,
  onClose,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    setErrorMessage(null);
    setSuccessNotice(null);

    // بررسی پسوند فایل h5
    if (!file.name.toLowerCase().endsWith('.h5') && !file.name.toLowerCase().endsWith('.hdf5')) {
      setErrorMessage('لطفاً فایلی با پسوند .h5 یا .hdf5 انتخاب کنید.');
      return;
    }

    setIsLoading(true);

    try {
      const summary = await parseH5ModelFile(file);
      onModelLoaded(summary);
      setSuccessNotice(`مدل هوش مصنوعی «${file.name}» با موفقیت بارگذاری و ساختار آن تحلیل شد.`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'خطا در خواندن یا تحلیل فایل مدل H5.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* هدر مدال */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between gap-4 bg-stone-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100">
                مدیریت و آپلود مدل هوش مصنوعی (H5)
              </h2>
              <p className="text-xs text-stone-400">
                بارگذاری مدل آموزش‌دیده Keras/TensorFlow برای تشخیص اوزان شعر
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

        {/* محتوای مدال */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* محفظه درگ و دراپ آپلود فایل .h5 */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-amber-400 bg-amber-500/10'
                : 'border-stone-700 hover:border-amber-500/60 bg-stone-950/40 hover:bg-stone-950/80'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".h5,.hdf5"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
              {isLoading ? (
                <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
              ) : (
                <Upload className="w-6 h-6" />
              )}
            </div>

            <p className="text-sm font-bold text-stone-200 mb-1">
              فایل مدل هوش مصنوعی با پسوند <span className="font-mono text-amber-400">.h5</span> را انتخاب کنید
            </p>
            <p className="text-xs text-stone-400 mb-4">
              فایل را به اینجا بکشید یا برای انتخاب از حافظه دستگاه کلیک کنید
            </p>

            <span className="inline-block px-3 py-1 rounded-lg bg-stone-800 text-stone-300 text-xs font-medium">
              فرمت پشتیبانی: Keras HDF5 (.h5)
            </span>
          </div>

          {/* پیام موفقیت یا خطا */}
          {errorMessage && (
            <div className="p-3 bg-red-950/70 border border-red-800 rounded-xl text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-950/70 border border-emerald-800 rounded-xl text-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* مشخصات مدل فعال کنونی */}
          <div className="bg-stone-950/70 rounded-xl p-5 border border-stone-800 space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold text-stone-200">
                  مدل فعال در حال حاضر:
                </span>
                <span className="text-xs font-medium text-amber-400">
                  {currentModel.isCustomLoaded ? 'مدل اختصاصی کاربر' : 'مدل پیش‌فرض سامانه'}
                </span>
              </div>

              {currentModel.isCustomLoaded && (
                <button
                  onClick={onResetToDefault}
                  className="text-xs text-stone-400 hover:text-stone-200 hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>بازگشت به مدل پیش‌فرض</span>
                </button>
              )}
            </div>

            {/* کارت‌های خلاصه متریک‌های شبکه عصبی */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800/80">
                <span className="text-stone-400 block text-[11px]">نام فایل</span>
                <span className="font-bold text-stone-200 truncate block mt-0.5" title={currentModel.name}>
                  {currentModel.name}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800/80">
                <span className="text-stone-400 block text-[11px]">حجم مدل</span>
                <span className="font-bold text-stone-200 font-mono block mt-0.5">
                  {formatBytes(currentModel.sizeBytes)}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800/80">
                <span className="text-stone-400 block text-[11px]">تعداد کلاس‌ها (کد پوشه‌ها)</span>
                <span className="font-bold text-stone-200 font-mono block mt-0.5">
                  {currentModel.outputUnits} کلاس
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-stone-900 border border-stone-800/80">
                <span className="text-stone-400 block text-[11px]">تعداد پارامترها</span>
                <span className="font-bold text-stone-200 font-mono block mt-0.5">
                  ~{currentModel.totalParameters.toLocaleString('fa-IR')}
                </span>
              </div>
            </div>

            {/* ساختار و ابعاد لایه‌ها */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-stone-400 font-medium">
                <Layers className="w-3.5 h-3.5 text-stone-400" />
                <span>معماری شبکه:</span>
                <span className="text-stone-200 font-semibold">{currentModel.architectureType}</span>
              </div>

              {currentModel.layerDescriptions && currentModel.layerDescriptions.length > 0 && (
                <div className="max-h-36 overflow-y-auto bg-stone-900/60 rounded-lg p-2 border border-stone-800/60 font-mono text-[11px] space-y-1">
                  {currentModel.layerDescriptions.map((layer, idx) => (
                    <div key={idx} className="flex items-center justify-between text-stone-400 hover:text-stone-200 px-2 py-0.5 rounded">
                      <span className="text-amber-400/90 truncate">{layer.name}</span>
                      <span className="text-stone-400 truncate">{layer.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* توضیح نحوه نگاشت پوشه‌ها */}
            <div className="p-3 rounded-lg bg-stone-900/40 border border-stone-800 text-[11px] text-stone-400 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                در هنگام آموزش مدل، هر کلاس متناظر با یک فولدر دارای کد معین (مانند ۲، ۱۸، ۴۲، ۸۱، ۳۳۲، ...) بوده است. این سامانه با خروجی شبکه شما، دقیقا کد پوشه متناظر را استخراج کرده و وزن عروضی فارسی مربوطه را نمایش می‌دهد.
              </span>
            </div>
          </div>

        </div>

        {/* فوتر مدال */}
        <div className="px-6 py-3 border-t border-stone-800 flex items-center justify-end bg-stone-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-200 bg-stone-800 hover:bg-stone-700 rounded-xl transition-colors"
          >
            بستن پنجره
          </button>
        </div>

      </div>
    </div>
  );
};
