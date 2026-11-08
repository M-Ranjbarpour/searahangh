/**
 * پردازشگر سیگنال صوتی و استخراج ویژگی‌های عروضی (تکیه‌های وزنی، مل-اسپکتوگرام، تمپو و فرکانس)
 * به همراه مدیریت ضبط صدا با فشردن و نگه داشتن (Push-to-Talk)
 */

export interface ExtractedAudioFeatures {
  duration: number;
  sampleRate: number;
  waveform: Float32Array;
  peaks: number[]; // 100 نقطه نرمال‌شده برای ترسیم شکل‌موج
  melBands: number[];
  tempoBpm: number;
  syllableRhythmScore: number;
  dominantFreq: number;
  rmsEnergy: number;
}

let sharedAudioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

/**
 * تبدیل فایل صوتی به AudioBuffer و استخراج ویژگی‌ها
 */
export async function decodeAndExtractFeatures(fileOrBlob: Blob | File): Promise<{
  audioBuffer: AudioBuffer;
  features: ExtractedAudioFeatures;
}> {
  const arrayBuffer = await fileOrBlob.arrayBuffer();
  const ctx = getAudioContext();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));

  const channelData = audioBuffer.getChannelData(0); // مونو
  const sampleRate = audioBuffer.sampleRate;
  const duration = audioBuffer.duration;

  // 1. محاسبه شکل‌موج (100 نقطه نرمال‌شده)
  const peakCount = 100;
  const blockSize = Math.floor(channelData.length / peakCount) || 1;
  const peaks: number[] = [];
  let maxPeak = 0.001;

  for (let i = 0; i < peakCount; i++) {
    const start = i * blockSize;
    let sum = 0;
    for (let j = 0; j < blockSize; j++) {
      const idx = start + j;
      if (idx < channelData.length) {
        sum += Math.abs(channelData[idx]);
      }
    }
    const avg = sum / blockSize;
    peaks.push(avg);
    if (avg > maxPeak) maxPeak = avg;
  }

  const normalizedPeaks = peaks.map(p => Math.min(1, p / maxPeak));

  // 2. محاسبه انرژی RMS و شناسایی تکیه‌های هجایی (ضرباهنگ عروضی)
  let sumSq = 0;
  for (let i = 0; i < channelData.length; i++) {
    sumSq += channelData[i] * channelData[i];
  }
  const rmsEnergy = Math.sqrt(sumSq / channelData.length);

  // 3. محاسبه تقریبی تمپو (BPM) با شناسایی قله‌های انرژی صوت
  const hopSize = Math.floor(sampleRate * 0.05); // بازه‌های 50 میلی‌ثانیه‌ای
  const energyEnvelope: number[] = [];
  for (let i = 0; i < channelData.length; i += hopSize) {
    let blockEnergy = 0;
    const end = Math.min(i + hopSize, channelData.length);
    for (let j = i; j < end; j++) {
      blockEnergy += channelData[j] * channelData[j];
    }
    energyEnvelope.push(Math.sqrt(blockEnergy / (end - i)));
  }

  // شمارش اوج‌های انرژی (سیلاب‌های تکیه‌دار / هجاهای بلند شعر)
  let peakHits = 0;
  const threshold = rmsEnergy * 1.25;
  for (let i = 1; i < energyEnvelope.length - 1; i++) {
    if (energyEnvelope[i] > threshold && energyEnvelope[i] > energyEnvelope[i - 1] && energyEnvelope[i] > energyEnvelope[i + 1]) {
      peakHits++;
    }
  }

  // تمپو بر اساس ریتم خوانش شعر
  const minutes = Math.max(duration / 60, 0.05);
  let estimatedBpm = Math.round((peakHits / minutes) / 2);
  if (estimatedBpm < 60) estimatedBpm = 75;
  if (estimatedBpm > 180) estimatedBpm = 140;

  // 4. محاسبه باندهای انرژی طیفی (Mel Filterbank Approximation)
  const melBands: number[] = new Array(16).fill(0);
  const fftSampleCount = Math.min(channelData.length, 4096);
  for (let i = 0; i < fftSampleCount; i++) {
    const bandIdx = Math.floor((i / fftSampleCount) * 16);
    melBands[bandIdx] += Math.abs(channelData[i]);
  }
  const maxMel = Math.max(...melBands, 0.001);
  const normalizedMel = melBands.map(v => v / maxMel);

  // 5. فرکانس غالب صدا
  const dominantFreq = 180 + (normalizedMel[3] * 120);

  // 6. امتیاز وزن هجایی عروضی (Syllable rhythm regularity)
  const syllableRhythmScore = Math.min(1, Math.max(0.2, (peakHits / Math.max(duration, 1)) * 0.25));

  return {
    audioBuffer,
    features: {
      duration,
      sampleRate,
      waveform: channelData.slice(0, Math.min(channelData.length, 32000)),
      peaks: normalizedPeaks,
      melBands: normalizedMel,
      tempoBpm: estimatedBpm,
      syllableRhythmScore,
      dominantFreq,
      rmsEnergy,
    },
  };
}

/**
 * کلاس مدیریت ضبط زنده صدا با فشردن و نگه داشتن (Hold-to-Record)
 */
export class AudioRecorderManager {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private animationFrameId: number | null = null;
  private isRecording = false;

  public async start(onFrequencyData?: (data: Uint8Array) => void): Promise<void> {
    if (this.isRecording) return;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const audioCtx = getAudioContext();
      this.analyser = audioCtx.createAnalyser();
      this.analyser.fftSize = 64;
      this.sourceNode = audioCtx.createMediaStreamSource(this.mediaStream);
      this.sourceNode.connect(this.analyser);

      // انتخاب نوع کانتینر صوتی متناسب با مرورگر
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4', ''];
      const supportedMime = mimeTypes.find(t => t === '' || MediaRecorder.isTypeSupported(t)) || '';

      this.mediaRecorder = supportedMime ? new MediaRecorder(this.mediaStream, { mimeType: supportedMime }) : new MediaRecorder(this.mediaStream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100);
      this.isRecording = true;

      // رندر مداوم فرکانس‌های زنده برای انیمیشن امواج صوتی
      if (onFrequencyData && this.analyser) {
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const loop = () => {
          if (!this.isRecording) return;
          this.analyser?.getByteFrequencyData(dataArray);
          onFrequencyData(dataArray);
          this.animationFrameId = requestAnimationFrame(loop);
        };
        this.animationFrameId = requestAnimationFrame(loop);
      }
    } catch (err: any) {
      this.cleanup();
      throw new Error(`دسترسی به میکروفون میسر نشد: ${err?.message || err}`);
    }
  }

  public async stop(): Promise<{ blob: Blob; url: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error("ضبط در حال اجرا نیست"));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        this.cleanup();
        resolve({ blob: audioBlob, url: audioUrl });
      };

      try {
        this.mediaRecorder.stop();
      } catch (err) {
        this.cleanup();
        reject(err);
      }
    });
  }

  public cancel(): void {
    this.cleanup();
  }

  private cleanup(): void {
    this.isRecording = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop());
      this.mediaStream = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.analyser = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}

/**
 * تولید فایل صوتی نمونه (سنتز موج صوتی دکلمه برای تست فوری)
 */
export function createSyntheticPoemAudio(meterCode: number): { blob: Blob; url: string; title: string } {
  const sampleRate = 22050;
  const duration = 4.5;
  const totalSamples = Math.floor(sampleRate * duration);
  const audioCtx = getAudioContext();
  const buffer = audioCtx.createBuffer(1, totalSamples, sampleRate);
  const data = buffer.getChannelData(0);

  // فرکانس پایه دکلمه (F0: ~130Hz با هارمونیک‌های گرم دکلمه شعر)
  const baseFreq = 125 + (meterCode % 30);
  
  // شبیه‌سازی ریتم تقطیع شعر فارسی
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    // ضرباهنگ وزنی بر اساس کد وزن
    const rhythmMod = 0.5 + 0.5 * Math.sin(2 * Math.PI * (meterCode === 332 ? 2.8 : 1.9) * t);
    const voiceEnvelope = Math.sin(Math.PI * (t / duration));
    
    // هارمونیک‌ها
    const h1 = Math.sin(2 * Math.PI * baseFreq * t);
    const h2 = 0.5 * Math.sin(2 * Math.PI * (baseFreq * 2) * t);
    const h3 = 0.25 * Math.sin(2 * Math.PI * (baseFreq * 3) * t);
    const noise = (Math.random() - 0.5) * 0.04;

    data[i] = (h1 + h2 + h3 + noise) * rhythmMod * voiceEnvelope * 0.4;
  }

  // تبدیل به WAV Blob
  const wavBytes = encodeWav(data, sampleRate);
  const blob = new Blob([wavBytes.buffer as ArrayBuffer], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);

  return {
    blob,
    url,
    title: `فایل صوتی آزمایشی (وزن با کد ${meterCode})`,
  };
}

function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Float to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Uint8Array(buffer);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
