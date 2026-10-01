/**
 * ComicCraft Local Storage System
 * Manages persistence for generated comic metadata and layouts.
 * Allows users to save, browse, retrieve, and delete previous creations.
 */

import type { ComicMetadata, ComicPanelLayout } from './types';
import { generateComicArtDataUrl } from './comicArtGenerator';

export interface SavedComic {
  id: string;
  title: string;
  characterName: string;
  setting: string;
  storyTone: string;
  artStyle: string;
  originalPrompt: string;
  createdAt: string;
  savedAt: string;
  layout: ComicPanelLayout[];
  metadata: ComicMetadata;
  thumbnailUrl: string;
}

const STORAGE_KEY = 'comiccraft_saved_comics_v1';
export const STORAGE_CHANGE_EVENT = 'comiccraft:storage_updated';

/**
 * Dispatches custom event to notify components across the app of storage updates
 */
function notifyStorageChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT));
  }
}

/**
 * Creates a built-in default sample comic so "My Comics" has rich content right away
 */
export function createSampleComic(): SavedComic {
  const metadata: ComicMetadata = {
    title: 'Barnaby and the Luminescent Oak',
    characterName: 'Barnaby the Fox',
    setting: 'Forest',
    storyTone: 'Light-hearted',
    artStyle: 'Comic Book',
    originalPrompt: 'A curious orange fox named Barnaby explores an enchanted forest and discovers a glowing ancient oak tree.',
    createdAt: new Date().toISOString(),
  };

  const panelPrompts = [
    'Barnaby the orange fox enters the sunlit enchanted woodland',
    'Barnaby peeking around ancient mossy oak trees seeing a golden glow',
    'Barnaby looking in awe at a giant glowing crystalline tree in the forest clearing',
    'Barnaby reaching out a paw to touch the glowing crystal tree as magic sparks burst',
    'Barnaby sleeping peacefully curled up under the gentle warm light of the crystal tree',
  ];

  const layout: ComicPanelLayout[] = [
    {
      panelNumber: 1,
      title: 'The Journey Begins',
      imageUrl: generateComicArtDataUrl({
        panelNumber: 1,
        prompt: panelPrompts[0],
        artStyle: 'Comic Book',
        setting: 'Forest',
        characterName: 'Barnaby the Fox',
      }),
      sceneDescription: 'Barnaby steps into the whispering woods, his alert tail twitching with anticipation.',
      caption: '*STEP... CRUNCH!*',
      narration: 'Deep in the heart of Emerald Glen, Barnaby always knew adventure was just one pawprint away.',
      imagePrompt: panelPrompts[0],
    },
    {
      panelNumber: 2,
      title: 'A Curious Glow',
      imageUrl: generateComicArtDataUrl({
        panelNumber: 2,
        prompt: panelPrompts[1],
        artStyle: 'Comic Book',
        setting: 'Forest',
        characterName: 'Barnaby the Fox',
      }),
      sceneDescription: 'Barnaby peeks around a massive tree trunk, mesmerized by a warm golden radiance ahead.',
      caption: '*RUSTLE!*',
      narration: '"What could possibly be shining brighter than the midday sun?" Barnaby whispered.',
      imagePrompt: panelPrompts[1],
    },
    {
      panelNumber: 3,
      title: 'The Luminescent Oak',
      imageUrl: generateComicArtDataUrl({
        panelNumber: 3,
        prompt: panelPrompts[2],
        artStyle: 'Comic Book',
        setting: 'Forest',
        characterName: 'Barnaby the Fox',
      }),
      sceneDescription: 'Barnaby stands motionless before a magnificent crystalline oak radiating starlight.',
      caption: '*SHIMMER!*',
      narration: 'Before him stood the legendary Luminescent Oak, its crystal leaves singing with magical energy.',
      imagePrompt: panelPrompts[2],
    },
    {
      panelNumber: 4,
      title: 'The Spark of Wonder',
      imageUrl: generateComicArtDataUrl({
        panelNumber: 4,
        prompt: panelPrompts[3],
        artStyle: 'Comic Book',
        setting: 'Forest',
        characterName: 'Barnaby the Fox',
      }),
      sceneDescription: 'Barnaby taps the crystal bark with his paw, triggering a shower of joyful sparks.',
      caption: '*ZAP! TINGLE!*',
      narration: 'The tree answered his gentle touch with a cascade of harmless, twinkling stardust.',
      imagePrompt: panelPrompts[3],
    },
    {
      panelNumber: 5,
      title: 'Sweet Slumber',
      imageUrl: generateComicArtDataUrl({
        panelNumber: 5,
        prompt: panelPrompts[4],
        artStyle: 'Comic Book',
        setting: 'Forest',
        characterName: 'Barnaby the Fox',
      }),
      sceneDescription: 'Barnaby curled up warmly under the luminescent canopy, dreaming of tomorrow.',
      caption: '*ZZZ... SNOOZE*',
      narration: 'Safe under the enchanted boughs, Barnaby drifted to sleep with a heart full of wonder.',
      imagePrompt: panelPrompts[4],
    },
  ];

  return {
    id: 'sample_barnaby_luminescent_oak',
    title: metadata.title,
    characterName: metadata.characterName,
    setting: metadata.setting,
    storyTone: metadata.storyTone,
    artStyle: metadata.artStyle,
    originalPrompt: metadata.originalPrompt,
    createdAt: metadata.createdAt || new Date().toISOString(),
    savedAt: new Date().toISOString(),
    layout,
    metadata,
    thumbnailUrl: layout[0].imageUrl,
  };
}

/**
 * Retrieves all saved comics from localStorage.
 * If storage is empty, automatically initializes with the starter sample comic.
 */
export function getSavedComics(): SavedComic[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // First visit: seed sample comic so users can explore immediately
      const sample = createSampleComic();
      saveComicsToStorage([sample]);
      return [sample];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed;
  } catch (err) {
    console.warn('Failed to parse saved comics from localStorage:', err);
    return [];
  }
}

/**
 * Retrieves a single saved comic by its unique ID
 */
export function getSavedComicById(id: string): SavedComic | null {
  const comics = getSavedComics();
  return comics.find((c) => c.id === id) || null;
}

/**
 * Helper to safely write comic list to localStorage with quota protection
 */
function saveComicsToStorage(comics: SavedComic[]): boolean {
  if (typeof window === 'undefined') return false;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comics));
    notifyStorageChange();
    return true;
  } catch (err: any) {
    console.warn('LocalStorage quota exceeded or write failed:', err);
    // If quota exceeded, try pruning oldest comics except the first 6
    if (comics.length > 6) {
      try {
        const pruned = comics.slice(0, 6);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
        notifyStorageChange();
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

/**
 * Saves a new comic to localStorage.
 * Places newest comic at the top of the collection.
 */
export function saveComic(
  metadata: ComicMetadata,
  layout: ComicPanelLayout[]
): SavedComic {
  const comics = getSavedComics();

  const id = `comic_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  // Pick thumbnail from panel 1 or first available
  const thumbnailUrl = layout[0]?.imageUrl || '';

  const newSavedComic: SavedComic = {
    id,
    title: metadata.title || `${metadata.characterName || 'Hero'}'s Adventure`,
    characterName: metadata.characterName || 'Hero',
    setting: metadata.setting || 'Forest',
    storyTone: metadata.storyTone || 'Light-hearted',
    artStyle: metadata.artStyle || 'Comic Book',
    originalPrompt: metadata.originalPrompt || '',
    createdAt: metadata.createdAt || nowIso,
    savedAt: nowIso,
    layout,
    metadata,
    thumbnailUrl,
  };

  // Avoid duplicates if identical title & prompt saved within last 5 seconds
  const isDuplicate = comics.some(
    (c) =>
      c.title === newSavedComic.title &&
      c.originalPrompt === newSavedComic.originalPrompt &&
      Math.abs(new Date(c.savedAt).getTime() - new Date(nowIso).getTime()) < 5000
  );

  if (isDuplicate) {
    return comics[0] || newSavedComic;
  }

  // Prepend to top
  const updatedComics = [newSavedComic, ...comics];
  saveComicsToStorage(updatedComics);

  return newSavedComic;
}

/**
 * Deletes a comic by ID
 */
export function deleteComic(id: string): boolean {
  const comics = getSavedComics();
  const filtered = comics.filter((c) => c.id !== id);
  if (filtered.length === comics.length) return false;

  saveComicsToStorage(filtered);
  return true;
}

/**
 * Clears all saved comics from localStorage
 */
export function clearAllSavedComics(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    notifyStorageChange();
  } catch (err) {
    console.warn('Error clearing localStorage comics:', err);
  }
}

/**
 * Returns total count of saved comics
 */
export function getSavedComicsCount(): number {
  return getSavedComics().length;
}
