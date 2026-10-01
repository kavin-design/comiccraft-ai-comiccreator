import type { ComicSetting, StoryTone, ArtStyle } from '../config';

export interface ComicInput {
  prompt: string;
  characterName: string;
  setting: ComicSetting | string;
  storyTone: StoryTone | string;
  artStyle: ArtStyle | string;
}

export interface PanelOutline {
  panelNumber: number;
  title: string;
  sceneDescription: string;
  imagePrompt: string;
}

export interface PanelStory {
  panelNumber: number;
  caption: string;
  narration: string;
}

export interface ComicPanelLayout {
  panelNumber: number;
  title: string;
  imageUrl: string;
  sceneDescription: string;
  caption: string;
  narration: string;
  imagePrompt: string;
}

export interface ComicMetadata {
  title: string;
  characterName: string;
  setting: string;
  storyTone: string;
  artStyle: string;
  originalPrompt: string;
  createdAt?: string;
}

export interface ImageGenerationResult {
  imageUrl: string;
  source: 'gemini' | 'pollinations' | 'placeholder';
  panelNumber?: number;
}
