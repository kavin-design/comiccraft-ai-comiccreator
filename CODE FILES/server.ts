import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import {
  GEMINI_FLASH_MODEL,
  GEMINI_FLASH_ALT_MODEL,
  GEMINI_FLASH_FALLBACK_MODEL,
  GEMINI_PRO_MODEL,
  GEMINI_IMAGE_MODEL,
  POLLINATIONS_BASE_URL,
} from './config';
import { generateComicArtDataUrl } from './services/comicArtGenerator';
import {
  generateNarrativeOutline,
  generateNarrativeStory,
} from './services/comicNarrativeEngine';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

// Lazy/Safe GenAI client initialization
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not defined in environment variables.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// --------------------------------------------------------------------------
// 1. OUTLINE ENDPOINT (Fast Gemini Flash)
// --------------------------------------------------------------------------
app.post('/api/comic/outline', async (req: Request, res: Response) => {
  try {
    const { prompt, characterName, setting, storyTone, artStyle } = req.body;

    if (!prompt || !characterName) {
      return res.status(400).json({ error: 'Prompt and character name are required.' });
    }

    const input = { prompt, characterName, setting, storyTone, artStyle };
    const ai = getGenAIClient();

    if (ai) {
      const systemInstruction = `You are a master comic book writer and storyboard artist.
Your job is to take a premise and produce a complete, punchy 5-panel comic outline.
Rules:
1. Exactly 5 panels numbered 1 to 5.
2. The story arc must have a beginning (Panel 1), rising action/inciting incident (Panel 2), turning point/conflict (Panel 3), climax/peak (Panel 4), and resolution/punchline (Panel 5).
3. The imagePrompt for each panel MUST include:
   - The main character name ("${characterName}") and visual characteristics
   - Setting: ${setting}
   - Art style: ${artStyle} comic illustration
   - Explicit character visual consistency description at the end (e.g., clothing, hair, colors, species) so they look identical across all panels.
4. Keep titles concise and exciting. Keep scene descriptions vivid.`;

      const promptText = `Generate a 5-panel comic strip outline with the following details:
- Main Character: ${characterName}
- Setting: ${setting}
- Tone: ${storyTone}
- Art Style: ${artStyle}
- Story Concept: ${prompt}

Respond in strict JSON with comicTitle and exactly 5 panels.`;

      const outlineConfig = {
        systemInstruction,
        temperature: 0.7,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            comicTitle: {
              type: Type.STRING,
              description: 'A catchy, creative comic strip title',
            },
            panels: {
              type: Type.ARRAY,
              description: 'Exactly 5 panels of the comic strip',
              items: {
                type: Type.OBJECT,
                properties: {
                  panelNumber: {
                    type: Type.INTEGER,
                    description: 'Panel index from 1 to 5',
                  },
                  title: {
                    type: Type.STRING,
                    description: 'Short dramatic panel title',
                  },
                  sceneDescription: {
                    type: Type.STRING,
                    description: 'Description of the visual scene and action in italics context',
                  },
                  imagePrompt: {
                    type: Type.STRING,
                    description:
                      'Detailed prompt for image generation including character name, setting, art style, and consistent character tags',
                  },
                },
                required: ['panelNumber', 'title', 'sceneDescription', 'imagePrompt'],
              },
            },
          },
          required: ['comicTitle', 'panels'],
        },
      };

      try {
        let outlineResponseText = '';
        try {
          const response = await ai.models.generateContent({
            model: GEMINI_FLASH_MODEL,
            contents: promptText,
            config: outlineConfig,
          });
          outlineResponseText = response.text?.trim() || '';
        } catch {
          const altResponse = await ai.models.generateContent({
            model: GEMINI_FLASH_ALT_MODEL,
            contents: promptText,
            config: outlineConfig,
          });
          outlineResponseText = altResponse.text?.trim() || '';
        }

        if (outlineResponseText) {
          const parsed = JSON.parse(outlineResponseText);
          if (Array.isArray(parsed.panels) && parsed.panels.length === 5) {
            return res.json(parsed);
          }
        }
      } catch {
        // Fall back to creative narrative engine below
      }
    }

    // Creative narrative engine fallback (guarantees complete 5-panel story strip)
    const fallbackOutline = generateNarrativeOutline(input);
    return res.json(fallbackOutline);
  } catch (error: any) {
    console.error('Error generating comic outline:', error);
    const safeOutline = generateNarrativeOutline({
      prompt: req.body?.prompt || 'Hero adventure',
      characterName: req.body?.characterName || 'Hero',
      setting: req.body?.setting || 'Forest',
      storyTone: req.body?.storyTone || 'Light-hearted',
      artStyle: req.body?.artStyle || 'Comic Book',
    });
    return res.json(safeOutline);
  }
});

// --------------------------------------------------------------------------
// 2. STORY ENDPOINT (Gemini Pro with automatic fallback to Flash)
// --------------------------------------------------------------------------
app.post('/api/comic/story', async (req: Request, res: Response) => {
  try {
    const { outline, input } = req.body;

    if (!outline || !Array.isArray(outline) || outline.length === 0) {
      return res.status(400).json({ error: 'Valid outline array is required.' });
    }

    const ai = getGenAIClient();

    if (ai) {
      const systemInstruction = `You are an award-winning comic book dialogue writer.
Given a 5-panel comic outline, generate the dialogue, narration, and comic sound/ambient caption for each panel.
Requirements:
1. Tone must strongly match "${input?.storyTone || 'Exciting'}":
   - Funny: comedic timing, witty quips, visual gags, irony.
   - Dramatic: high stakes, emotional depth, intense speech.
   - Poetic: lyrical cadence, evocative metaphors, atmospheric phrasing.
   - Light-hearted: warm, whimsical, cheerful, friendly banter.
2. For each panel:
   - "caption": Brief ambient atmosphere description, or comic sound effects (e.g. *WHOOSH!*, *CRACKLE!*).
   - "narration": Character speech in quotes (e.g. ${input?.characterName}: "Look at that!") alongside narrative prose.`;

      const promptText = `Write the comic narration, dialogue, and sound captions for each panel:
Main Character: ${input?.characterName}
Tone: ${input?.storyTone}
Panels Outline:
${JSON.stringify(outline, null, 2)}

Provide JSON containing the panels array with panelNumber, caption, and narration.`;

      const schemaConfig = {
        type: Type.OBJECT,
        properties: {
          panels: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                panelNumber: { type: Type.INTEGER },
                caption: {
                  type: Type.STRING,
                  description: 'Ambient sound effect or scene caption banner',
                },
                narration: {
                  type: Type.STRING,
                  description: 'Narration with dialogue in quotation marks',
                },
              },
              required: ['panelNumber', 'caption', 'narration'],
            },
          },
        },
        required: ['panels'],
      };

      try {
        let textResponse = '';
        try {
          const proResponse = await ai.models.generateContent({
            model: GEMINI_PRO_MODEL,
            contents: promptText,
            config: {
              systemInstruction,
              temperature: 0.8,
              responseMimeType: 'application/json',
              responseSchema: schemaConfig,
            },
          });
          textResponse = proResponse.text?.trim() || '';
        } catch {
          try {
            const flashResponse = await ai.models.generateContent({
              model: GEMINI_FLASH_MODEL,
              contents: promptText,
              config: {
                systemInstruction,
                temperature: 0.8,
                responseMimeType: 'application/json',
                responseSchema: schemaConfig,
              },
            });
            textResponse = flashResponse.text?.trim() || '';
          } catch {
            const fallbackResponse = await ai.models.generateContent({
              model: GEMINI_FLASH_ALT_MODEL,
              contents: promptText,
              config: {
                systemInstruction,
                temperature: 0.8,
                responseMimeType: 'application/json',
                responseSchema: schemaConfig,
              },
            });
            textResponse = fallbackResponse.text?.trim() || '';
          }
        }

        if (textResponse) {
          const parsed = JSON.parse(textResponse);
          if (Array.isArray(parsed.panels) && parsed.panels.length > 0) {
            return res.json(parsed);
          }
        }
      } catch {
        // Fall back to creative narrative engine below
      }
    }

    // Creative narrative engine fallback
    const fallbackStoryPanels = generateNarrativeStory(outline, input || {});
    return res.json({ panels: fallbackStoryPanels });
  } catch (error: any) {
    console.error('Error generating comic story:', error);
    const safePanels = generateNarrativeStory(req.body?.outline || [], req.body?.input || {});
    return res.json({ panels: safePanels });
  }
});

// --------------------------------------------------------------------------
// 3. IMAGE GENERATION ENDPOINT (Gemini Image -> Pollinations -> SVG Fallback)
// --------------------------------------------------------------------------
app.post('/api/comic/image', async (req: Request, res: Response) => {
  const { imagePrompt, artStyle, panelNumber, setting, characterName } = req.body;
  
  // Clean and simplify prompt: strip "Visual consistency...", keep punchy
  let cleanPrompt = (imagePrompt || 'Comic panel scene').split(/visual consistency/i)[0];
  cleanPrompt = cleanPrompt.replace(/[\r\n\t]+/g, ' ').replace(/[^\w\s,-]/gi, '').trim();
  const punchyWords = cleanPrompt.split(/\s+/).slice(0, 18).join(' ');
  const finalPrompt = punchyWords ? `${punchyWords}, ${artStyle || 'Comic Book'} comic illustration` : 'Comic book panel scene';

  // 1. Try Gemini Image Model
  const ai = getGenAIClient();
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_IMAGE_MODEL,
        contents: {
          parts: [
            {
              text: `${finalPrompt}, colorful comic book art, crisp lines, vivid panel art`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: '1:1',
          },
        },
      });

      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        const parts = candidates[0].content?.parts || [];
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            const mime = part.inlineData.mimeType || 'image/png';
            const dataUrl = `data:${mime};base64,${part.inlineData.data}`;
            return res.json({ imageUrl: dataUrl, source: 'gemini', panelNumber });
          }
        }
      }
    } catch {
      // Expected on free tier (Gemini image model requires paid plan) -> seamlessly proceed to Pollinations / Comic Art Engine
    }
  }

  // 2. Pollinations.ai Fallback (Clean URL, no paid parameters like nologo or seed)
  try {
    const pollinationsUrl = `${POLLINATIONS_BASE_URL}/${encodeURIComponent(finalPrompt)}`;

    const imgResponse = await fetch(pollinationsUrl, {
      headers: {
        'User-Agent': 'curl/7.88.1',
        'Accept': 'image/*,*/*',
      },
      signal: AbortSignal.timeout(5000),
    });

    if (imgResponse.ok) {
      const contentType = imgResponse.headers.get('content-type') || '';
      if (contentType.includes('image/')) {
        const arrayBuffer = await imgResponse.arrayBuffer();
        if (arrayBuffer && arrayBuffer.byteLength > 1000) {
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          const dataUrl = `data:${contentType};base64,${base64}`;
          return res.json({ imageUrl: dataUrl, source: 'pollinations', panelNumber });
        }
      }
    }
  } catch {
    // Seamlessly proceed to Comic Art Engine
  }

  // 3. Fallback: High quality comic scene artwork tailored to character, setting & beat
  const comicArtDataUrl = generateComicArtDataUrl({
    panelNumber: Number(panelNumber) || 1,
    prompt: imagePrompt || '',
    artStyle: artStyle || 'Comic Book',
    setting: setting || 'Forest',
    characterName: characterName || 'Hero',
  });

  return res.json({
    imageUrl: comicArtDataUrl,
    source: 'comic-art',
    panelNumber,
  });
});

// --------------------------------------------------------------------------
// Health Check
// --------------------------------------------------------------------------
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    models: {
      flash: GEMINI_FLASH_MODEL,
      pro: GEMINI_PRO_MODEL,
      image: GEMINI_IMAGE_MODEL,
    },
  });
});

// --------------------------------------------------------------------------
// Start Server & Mount Vite in dev / Static files in prod
// --------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ComicCraft server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
