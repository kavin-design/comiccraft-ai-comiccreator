/**
 * ComicCraft Narrative Engine
 * Generates structured 5-panel comic storylines, captions, dialogue, and image prompts.
 * Used when external AI APIs are offline, rate-limited, unauthenticated, or undergoing maintenance.
 * Ensures the comic generation pipeline NEVER fails and users always receive a complete, engaging 5-panel comic strip.
 */

import type { ComicInput, PanelOutline, PanelStory } from './types';

// Sound effect banks by tone and setting
const SOUND_EFFECTS: Record<string, string[]> = {
  'Forest': ['*RUSTLE!*', '*CRUNCH!*', '*HOOT...*', '*SNAP!*', '*SWOOSH!*'],
  'Space': ['*BEEP-BOOP!*', '*WHOOSH!*', '*ZAP!*', '*HISS...*', '*PING!*'],
  'City': ['*HONK!*', '*SCREECH!*', '*SIREN!*', '*CLATTER!*', '*RUMBLE!*'],
  'School': ['*RINGGG!*', '*SLAM!*', '*WHISPER...*', '*BUZZ!*', '*DING!*'],
  'Light-hearted': ['*BOING!*', '*POP!*', '*TWINKLE!*', '*WHEEE!*', '*TA-DA!*'],
  'Dramatic': ['*CRACK!*', '*BOOM!*', '*THUD!*', '*GASP!*', '*KAPOW!*'],
  'Poetic': ['*SIGH...*', '*MURMUR...*', '*SHIMMER!*', '*WHISPER!*', '*GLOW!*'],
  'Funny': ['*BONK!*', '*SPLAT!*', '*PLOP!*', '*BOINK!*', '*YIKES!*'],
};

function getSoundEffect(setting: string, tone: string, index: number): string {
  const list = SOUND_EFFECTS[tone] || SOUND_EFFECTS[setting] || SOUND_EFFECTS['Light-hearted'];
  return list[index % list.length] || '*POW!*';
}

function extractKeywords(prompt: string): string {
  if (!prompt) return 'an unexpected mystery';
  const clean = prompt.replace(/[^\w\s]/gi, '').trim();
  const words = clean.split(/\s+/).slice(0, 8).join(' ');
  return words || 'an unexpected quest';
}

/**
 * Generates a full 5-panel outline tailored to the user's prompt, character, setting, and tone.
 */
export function generateNarrativeOutline(input: ComicInput): {
  comicTitle: string;
  panels: PanelOutline[];
} {
  const { characterName, setting, storyTone, artStyle, prompt } = input;
  const hero = characterName || 'Our Hero';
  const topic = extractKeywords(prompt);

  // Creative title generator
  const titleTemplates = [
    `${hero} and the ${setting} Mystery`,
    `${hero}: Tale of ${setting}`,
    `The ${storyTone} Quest of ${hero}`,
    `${hero}'s Great ${setting} Adventure`,
  ];
  const comicTitle = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];

  // Scene templates across the 5-act narrative arc
  const arcStages = [
    {
      title: 'The Spark of Curiosity',
      descPrefix: `${hero} begins the day in the heart of the ${setting.toLowerCase()}, unaware that ${topic} is about to change everything.`,
      promptDetail: `${hero} looking curious and ready for adventure in a vibrant ${setting.toLowerCase()} environment`,
    },
    {
      title: 'The Unexpected Discovery',
      descPrefix: `Venturing deeper into the ${setting.toLowerCase()}, ${hero} stumbles upon a strange trail connected to ${topic}.`,
      promptDetail: `${hero} investigating mysterious clues and signs in the ${setting.toLowerCase()}`,
    },
    {
      title: 'The Critical Turning Point',
      descPrefix: `Sudden drama strikes! ${hero} faces a sudden surge of challenge right in the center of the ${setting.toLowerCase()}.`,
      promptDetail: `Dynamic heroic action scene of ${hero} confronting the challenge in the ${setting.toLowerCase()}`,
    },
    {
      title: 'The Clever Breakthrough',
      descPrefix: `Refusing to back down, ${hero} uses quick wits and unique skills to master the situation.`,
      promptDetail: `${hero} pulling off a clever maneuver with determination in the ${setting.toLowerCase()}`,
    },
    {
      title: 'Triumphant Finale',
      descPrefix: `The dust settles as ${hero} stands victorious under the ${setting.toLowerCase()} sky, smiling with pride.`,
      promptDetail: `Celebratory final shot of ${hero} smiling happily in the ${setting.toLowerCase()} after resolving ${topic}`,
    },
  ];

  const panels: PanelOutline[] = arcStages.map((stage, idx) => ({
    panelNumber: idx + 1,
    title: stage.title,
    sceneDescription: stage.descPrefix,
    imagePrompt: `${stage.promptDetail}, ${artStyle} comic art style, detailed colorful panel illustration`,
  }));

  return { comicTitle, panels };
}

/**
 * Generates rich dialogue, narration, and comic sound captions for each panel.
 */
export function generateNarrativeStory(
  outline: PanelOutline[],
  input: ComicInput
): PanelStory[] {
  const { characterName, setting, storyTone, prompt } = input;
  const hero = characterName || 'Our Hero';

  const toneDialogues: Record<string, string[]> = {
    'Light-hearted': [
      `"${setting} is full of surprises today!" ${hero} chuckled, stepping forward eagerly.`,
      `"Aha! Look at that curious glow over there," ${hero} whispered with a bright grin.`,
      `"Hold on tight, everyone! This is where the real fun begins!" shouted ${hero}.`,
      `"Piece of cake! Just a little twist, and... presto!" ${hero} laughed.`,
      `"Another fantastic adventure in the books! Time for a well-deserved snack." ${hero} beamed.`,
    ],
    'Dramatic': [
      `The wind was cold across the ${setting.toLowerCase()}. ${hero} gripped their stance, knowing time was short.`,
      `"Something is shifting... the balance is broken," ${hero} muttered, eyes narrowing at the shadows.`,
      `"I won't let this end here!" roared ${hero}, bracing against the overwhelming force.`,
      `With razor-sharp focus, ${hero} unleashed their resolve, turning the tide of battle.`,
      `Silence fell over the ${setting.toLowerCase()}. ${hero} stood tall. The threat had passed.`,
    ],
    'Funny': [
      `"Note to self: Never go exploring without breakfast," ${hero} grumbled, looking around the ${setting.toLowerCase()}.`,
      `"Wait, what is THAT doing here?! That definitely wasn't in the brochure!" ${hero} gasped.`,
      `"WHOA WHOA WHOA! Don't push that big red—" ${hero} shrieked as chaos unfolded.`,
      `"Okay, totally calculated move! Everything is under complete control!" ${hero} stammered.`,
      `Covered in glitter and dust, ${hero} gave a thumbs-up. "Nailed it on the first try."`,
    ],
    'Poetic': [
      `Beneath the quiet expanse of the ${setting.toLowerCase()}, ${hero} paused to listen to the whispers of fate.`,
      `A solitary beam of light touched the horizon, beckoning ${hero} toward the forgotten mysteries.`,
      `Between shadow and radiance, the moment suspended in time as ${hero} made their fateful choice.`,
      `Like water finding its riverbed, harmony rippled outwards through ${hero}'s gentle touch.`,
      `Peace returned to the world, lingering like starlight in the calm eyes of ${hero}.`,
    ],
  };

  const selectedDialogues = toneDialogues[storyTone] || toneDialogues['Light-hearted'];

  return outline.map((panel, idx) => ({
    panelNumber: panel.panelNumber || idx + 1,
    caption: getSoundEffect(setting, storyTone, idx),
    narration: selectedDialogues[idx % selectedDialogues.length],
  }));
}
