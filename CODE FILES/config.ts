/**
 * ComicCraft Configuration
 * Single source of truth for AI model names and options
 */

// Gemini Text Models
export const GEMINI_FLASH_MODEL = 'gemini-3.1-flash-lite';
export const GEMINI_FLASH_ALT_MODEL = 'gemini-flash-latest';
export const GEMINI_FLASH_FALLBACK_MODEL = 'gemini-3.8-flash';
export const GEMINI_PRO_MODEL = 'gemini-3.1-pro-preview';

// Gemini Image Generation Model
export const GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-lite-image';

// Fallback Pollinations Endpoint
export const POLLINATIONS_BASE_URL = 'https://image.pollinations.ai/prompt';

// Dropdown options
export const SETTINGS = ['School', 'Forest', 'Space', 'City'] as const;
export type ComicSetting = typeof SETTINGS[number];

export const STORY_TONES = ['Light-hearted', 'Dramatic', 'Poetic', 'Funny'] as const;
export type StoryTone = typeof STORY_TONES[number];

export const ART_STYLES = ['Anime', 'Pixel Art', 'Comic Book', 'Realistic'] as const;
export type ArtStyle = typeof ART_STYLES[number];
