import type { ComicInput, PanelOutline, PanelStory } from './types';

/**
 * Generates story text (caption + narration with dialogue) for all 5 panels.
 * Calls backend which uses Gemini Pro with automatic fallback to Gemini Flash.
 */
export async function generateStory(
  outline: PanelOutline[],
  input: ComicInput
): Promise<PanelStory[]> {
  const response = await fetch('/api/comic/story', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ outline, input }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server returned ${response.status}: Failed to generate story dialogue`);
  }

  const data = await response.json();
  const rawPanels = data.panels;

  if (!Array.isArray(rawPanels) || rawPanels.length === 0) {
    throw new Error('Received invalid story format from the AI generator.');
  }

  // Ensure 5 panel story matching the outline
  const storyPanels: PanelStory[] = outline.map((outPanel, index) => {
    const found = rawPanels.find((p: any) => p.panelNumber === outPanel.panelNumber) || rawPanels[index] || {};
    return {
      panelNumber: outPanel.panelNumber,
      caption: found.caption?.trim() || `Scene ${outPanel.panelNumber}: ${outPanel.title}`,
      narration: found.narration?.trim() || `${input.characterName} looks ahead with determination.`,
    };
  });

  return storyPanels;
}
