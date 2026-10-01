import type { PanelOutline, PanelStory, ComicPanelLayout } from './types';

/**
 * Combines outlines, stories, and generated images into the final 5-panel layout structure.
 *
 * @param outline Array of 5 panel outlines
 * @param story Array of 5 panel stories (caption + narration)
 * @param images Array of 5 image URLs (base64 or remote)
 * @returns Array of ComicPanelLayout items
 */
export function buildComicLayout(
  outline: PanelOutline[],
  story: PanelStory[],
  images: string[]
): ComicPanelLayout[] {
  if (!Array.isArray(outline) || outline.length === 0) {
    throw new Error('Cannot build comic layout: Outline is missing or empty.');
  }

  return outline.map((outPanel, index) => {
    const stPanel = story.find((s) => s.panelNumber === outPanel.panelNumber) || story[index] || {
      caption: '',
      narration: '',
    };
    const imageUrl = images[index] || '';

    return {
      panelNumber: outPanel.panelNumber || index + 1,
      title: outPanel.title || `Panel ${index + 1}`,
      imageUrl,
      sceneDescription: outPanel.sceneDescription || '',
      caption: stPanel.caption || '',
      narration: stPanel.narration || '',
      imagePrompt: outPanel.imagePrompt || '',
    };
  });
}
