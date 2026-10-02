import type { ComicInput, PanelOutline } from './types';

export interface OutlineResponse {
  comicTitle: string;
  panels: PanelOutline[];
}

/**
 * Validates that outline has exactly 5 valid panels
 */
function validateOutlinePanels(panels: any[]): panels is PanelOutline[] {
  if (!Array.isArray(panels) || panels.length !== 5) {
    return false;
  }
  return panels.every(
    (p, idx) =>
      typeof p === 'object' &&
      p !== null &&
      (p.panelNumber === idx + 1 || typeof p.panelNumber === 'number') &&
      typeof p.title === 'string' &&
      p.title.trim().length > 0 &&
      typeof p.sceneDescription === 'string' &&
      p.sceneDescription.trim().length > 0 &&
      typeof p.imagePrompt === 'string' &&
      p.imagePrompt.trim().length > 0
  );
}

/**
 * Generates a 5-panel comic outline using Gemini Flash.
 * Retries up to 2 times if validation fails.
 */
export async function generateOutline(
  input: ComicInput
): Promise<{ comicTitle: string; panels: PanelOutline[] }> {
  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/api/comic/outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned ${response.status}: Failed to generate outline`);
      }

      const data = await response.json();
      const rawPanels = data.panels;

      if (validateOutlinePanels(rawPanels)) {
        // Normalize panel numbers 1 to 5
        const normalizedPanels: PanelOutline[] = rawPanels.map((p, index) => ({
          panelNumber: index + 1,
          title: p.title.trim(),
          sceneDescription: p.sceneDescription.trim(),
          imagePrompt: p.imagePrompt.trim(),
        }));

        const comicTitle = data.comicTitle?.trim() || `${input.characterName}'s Adventure`;

        return {
          comicTitle,
          panels: normalizedPanels,
        };
      } else {
        throw new Error('Outline validation failed: Expected exactly 5 complete panels.');
      }
    } catch (err: any) {
      lastError = err;
      if (attempt < maxRetries) {
        console.warn(`Outline generation attempt ${attempt + 1} failed, retrying...`, err.message);
        await new Promise((res) => setTimeout(res, 800));
      }
    }
  }

  throw new Error(
    lastError?.message || 'Could not generate a valid 5-panel comic outline after 3 attempts. Please try again.'
  );
}
