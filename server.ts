import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { FOLDER_METERS } from './src/data/meters.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// وضعیت سلامت و در دسترس بودن کلید جمینای
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    supportedMeterCount: Object.keys(FOLDER_METERS).length,
  });
});

// مسیر تحلیل پیشرفته و تطبیق متن شعر و تقطیع عروضی
app.post('/api/analyze-prosody', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType, detectedCode } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        available: false,
        message: 'کلید GEMINI_API_KEY روی سرور تعریف نشده است. تحلیل محلی H5 فعال است.',
      });
    }

    const ai = new GoogleGenAI();
    const contents: any[] = [];

    // ارسال لیست کدهای اوزان به پرامپت جهت هدایت دقیق
    const codesSummary = Object.entries(FOLDER_METERS)
      .slice(0, 40)
      .map(([code, meter]) => `${code}: ${meter}`)
      .join('\n');

    const promptText = `شما یک استاد برجسته ادبیات فارسی و عروض و قافیه هستید.
وظیفه شما:
1. شنیدن فایل صوتی دکلمه یا خوانش شعر فارسی ارسال شده.
2. استخراج متن دقیق ابیات خوانده شده (شعر فارسی).
3. تعیین وزن عروضی، بحر، و مشخص کردن کد متناظر از بین کدهای زیر:
${codesSummary}
کد پیشنهادی اولیه مدل عصبی صوت: ${detectedCode || 'نامشخص'}

پاسخ را دقیقاً در قالب فرمت JSON معتبر زیر بازگردانید (هیچ متن یا علامت اضافی پیش یا پس از JSON ارسال نکنید):
{
  "transcribedVerses": ["بیت اول", "بیت دوم در صورت وجود"],
  "poet": "نام شاعر (مثلاً حافظ، سعدی، فردوسی، مولانا)",
  "poemTitle": "عنوان یا مطلع شعر",
  "matchedFolderCode": 81,
  "meterPattern": "فاعلاتن فاعلاتن فاعلاتن فاعلن",
  "bahr": "رمل مثمن محذوف",
  "scansionSyllables": "— U — — / — U — — / — U — — / — U —",
  "notes": "توضیح کوتاه درباره تقطیع و اختیارات شاعری در خوانش"
}`;

    if (audioBase64) {
      contents.push({
        inlineData: {
          mimeType: mimeType || 'audio/webm',
          data: audioBase64,
        },
      });
    }

    contents.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
    });

    const responseText = response.text || '';
    
    // تمیز کردن خروجی JSON
    const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    let parsedData = {};
    try {
      parsedData = JSON.parse(cleanJson);
    } catch {
      parsedData = { rawText: responseText };
    }

    return res.json({
      available: true,
      analysis: parsedData,
    });
  } catch (error: any) {
    console.error('Error analyzing prosody:', error);
    return res.status(500).json({
      available: false,
      error: error?.message || 'خطا در ارتباط با مدل تحلیل',
    });
  }
});

// در حالت توسعه: اتصال Vite Dev Server به عنوان Middleware
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`> Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
