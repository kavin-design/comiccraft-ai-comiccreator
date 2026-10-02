import { GEMINI_IMAGE_MODEL, POLLINATIONS_BASE_URL } from '../config';
import { generateComicArtDataUrl } from './comicArtGenerator';

// Primary Gemini image-generation model constant (easy to change)
export const CURRENT_GEMINI_IMAGE_MODEL = GEMINI_IMAGE_MODEL;

/**
 * Sanitizes prompt for safe usage in URLs, requests, or filenames
 */
export function sanitizePrompt(prompt: string): string {
  return prompt
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[^\w\s.,!?'"#-]/gi, '')
    .trim()
    .slice(0, 300);
}

/**
 * Attempts to load an image URL in the browser and convert to base64 data URL
 */
async function convertImageUrlToBase64InBrowser(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 768;
        canvas.height = img.naturalHeight || 768;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas context unavailable');
        }
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Failed to load image for canvas conversion'));
    img.src = url;
  });
}

/**
 * Generates an illustration for a single comic panel:
 * 1. Calls the backend API which tries Gemini Image Generation (`gemini-3.1-flash-lite-image`).
 * 2. If Gemini fails or hits quota, backend falls back to Pollinations.ai with clean parameters.
 * 3. If that also fails, returns a rich, detailed comic art panel illustration matching character, setting, and plot beat.
 *
 * @param imagePrompt The visual prompt for this panel
 * @param artStyle Chosen comic art style
 * @param panelNumber 1-based panel index
 * @param setting Optional comic setting (Forest, Space, City, School)
 * @param characterName Optional protagonist name
 * @returns Base64 image data URL (`data:image/...;base64,...`)
 */
export async function generateImage(
  imagePrompt: string,
  artStyle: string,
  panelNumber: number,
  setting?: string,
  characterName?: string
): Promise<string> {
  const sanitized = sanitizePrompt(imagePrompt);

  try {
    // 1. Try server-side generation (Gemini -> Pollinations -> Comic Art Engine on backend)
    const response = await fetch('/api/comic/image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imagePrompt: sanitized,
        artStyle,
        panelNumber,
        setting,
        characterName,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.imageUrl && data.imageUrl.startsWith('data:image/')) {
        return data.imageUrl;
      }
      if (data.imageUrl && data.imageUrl.startsWith('http')) {
        try {
          const base64Url = await convertImageUrlToBase64InBrowser(data.imageUrl);
          return base64Url;
        } catch {
          return data.imageUrl;
        }
      }
    }
  } catch (backendErr) {
    console.warn(`[Panel ${panelNumber}] Backend image route failed, attempting client fallback:`, backendErr);
  }

  // 2. Client-side fallback: Clean Pollinations URL
  try {
    const cleanPrompt = sanitized.split(/visual consistency/i)[0].trim().slice(0, 100);
    const pollinationsUrl = `${POLLINATIONS_BASE_URL}/${encodeURIComponent(
      `${cleanPrompt}, ${artStyle} comic art style`
    )}`;

    const base64Data = await convertImageUrlToBase64InBrowser(pollinationsUrl);
    if (base64Data && base64Data.startsWith('data:image/')) {
      return base64Data;
    }
  } catch (pollinationsErr) {
    console.warn(`[Panel ${panelNumber}] Client Pollinations note:`, pollinationsErr);
  }

  // 3. Ultimate Fallback: Rich, detailed comic art illustration
  return generateComicArtDataUrl({
    panelNumber,
    prompt: imagePrompt,
    artStyle,
    setting,
    characterName,
  });
}
