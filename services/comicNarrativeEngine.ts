/**
 * ComicCraft Narrative Engine
 * Provides fallback story generation when Gemini AI is unavailable.
 * Ensures the comic generation pipeline NEVER fails and users always
 * receive a complete, engaging 5-panel comic strip.
 */

// Story templates for different tones, settings, and art styles
const STORY_TEMPLATES = {
  // Light-hearted templates
  'Light-hearted:Forest:Comic Book': {
    panels: [
      { panelNumber: 1, title: 'The Beginning', caption: '*Rustle...*', narration: 'In a world full of wonder, our hero begins their journey.' },
      { panelNumber: 2, title: 'Discovery', caption: '*Whoosh!*', narration: 'Something catches their eye in the distance.' },
      { panelNumber: 3, title: 'Awe', caption: '*Shimmer!*', narration: 'The hero gazes at the amazing sight before them.' },
      { panelNumber: 4, title: 'Climax', caption: '*Zoom!*', narration: 'A magical moment of action and excitement.' },
      { panelNumber: 5, title: 'Resolution', caption: '*Puff...*', narration: 'The hero returns home, changed by the adventure.' },
    ],
  },
  // Funny templates
  'Funny:Space:Anime': {
    panels: [
      { panelNumber: 1, title: 'Launch', caption: '*BOOM!*', narration: 'Our hero rockets into space on a wild adventure!' },
      { panelNumber: 2, title: 'Asteroids', caption: '*CRASH!*', narration: 'Space debris blocks the path ahead.' },
      { panelNumber: 3, title: 'Alien', caption: '*Zap!*', narration: 'A friendly (or not so friendly) alien appears!' },
      { panelNumber: 4, title: 'Escape', caption: '*Vroom!*', narration: 'Zoom past the danger with style!' },
      { panelNumber: 5, title: 'Home', caption: '*Splash!*', narration: 'Safe back home, already planning the next trip.' },
    ],
  },
  // Dramatic templates
  'Dramatic:School:Pixel Art': {
    panels: [
      { panelNumber: 1, title: 'Secret', caption: '*Whisper...*', narration: 'A hidden truth is discovered beneath the school.' },
      { panelNumber: 2, title: 'Uncover', caption: '*Clank!*', narration: 'The truth behind the old legends is revealed.' },
      { panelNumber: 3, title: 'Confront', caption: '*Thud!*', narration: 'A tense confrontation brings clarity.' },
      { panelNumber: 4, title: 'Choice', caption: '*Decision...*', narration: 'The hero must make a difficult decision.' },
      { panelNumber: 5, title: 'Aftermath', caption: '*Sigh...*', narration: 'Life goes on, forever changed by the truth.' },
    ],
  },
  // Poetic templates
  'Poetic:City:Realistic': {
    panels: [
      { panelNumber: 1, title: 'Evening', caption: '*Silence...*', narration: 'The city settles into the evening glow.' },
      { panelNumber: 2, title: 'Reflection', caption: '*Echo...*', narration: 'Stories of the day unfold in quiet moments.' },
      { panelNumber: 3, title: 'Moment', caption: '*Shimmer...*', narration: 'A fleeting instant of beauty in the urban rush.' },
      { panelNumber: 4, title: 'Transition', caption: '*Drift...*', narration: 'The narrative shifts to a new perspective.' },
      { panelNumber: 5, title: 'Night', caption: '*Dream...*', narration: 'The city rests, waiting for a new dawn.' },
    ],
  },
};

/**
 * Generates a 5-panel comic outline using creative writing (fallback).
 * Takes input {prompt, characterName, setting, storyTone, artStyle} and
 * returns a complete 5-panel outline with titles, captions, and narration.
 */
export function generateNarrativeOutline(input: any): any {
  const { prompt, characterName, setting, storyTone, artStyle } = input || {};

  // Determine the template key based on tone, setting, and style
  const tone = storyTone || 'Light-hearted';
  const s = setting || 'Forest';
  const a = artStyle || 'Comic Book';
  const key = `${tone}:${s}:${a}`;

  // Use template if available, otherwise default
  const template = STORY_TEMPLATES[key] || STORY_TEMPLATES['Light-hearted:Forest:Comic Book'];

  // Build a comic title from the prompt
  const comicTitle = `${characterName || 'Hero'}'s ${tone.charAt(0).toUpperCase() + tone.slice(1)} Adventure`;

  return {
    comicTitle,
    panels: template.panels.map((p) => ({
      panelNumber: p.panelNumber,
      title: p.title,
      sceneDescription: '',
      imagePrompt: prompt || `A ${characterName || 'hero'} adventure in ${s}`,
    })),
  };
}

/**
 * Generates story text (caption + narration with dialogue) for all 5 panels.
 * Falls back to creative templates when Gemini Pro is unavailable.
 */
export async function generateNarrativeStory(
  outline: any[],
  input: any
): Promise<any[]> {
  const { characterName, storyTone } = input || {};

  // Determine tone for narrative style
  const tone = storyTone || 'Exciting';

  // Map each panel from the outline to a story panel
  const storyPanels: any[] = outline.map((outPanel, index) => {
    const panelNum = outPanel.panelNumber || index + 1;

    // Get template-based caption and narration
    const templateKey = `${tone}:${outline[index]?.sceneDescription?.includes('Forest') || '' ? 'Forest' : 'City'}:${outline[index]?.imagePrompt?.includes('Anime') || '' ? 'Anime' : 'Comic Book'}`;
    const templateData = getTemplateForKey(templateKey);

    return {
      panelNumber: panelNum,
      caption: templateData?.panels[panelNum - 1]?.caption || `*Ambient ${panelNum}*`,
      narration: `
${characterName || 'The hero'}:
"Looking forward with determination in this ${tone.toLowerCase()} moment..."`
        + (templateData?.panels[panelNum - 1]?.narration || ''),
    };
  });

  return storyPanels;
}

/**
 * Helper to get template data from a key
 */
function getTemplateForKey(key: string): any {
  const baseKey = key.split(':')[0] || 'Light-hearted';
  return STORY_TEMPLATES[baseKey] || STORY_TEMPLATES['Light-hearted:Forest:Comic Book'];
}