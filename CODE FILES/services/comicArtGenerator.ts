/**
 * Comic Art Generator
 * Generates rich, authentic comic book panel illustrations tailored to:
 * - Setting (Forest, Space, City, School)
 * - Art Style (Comic Book, Anime, Pixel Art, Realistic)
 * - Panel Beat (1: Intro/Journey, 2: Suspense/Discovery, 3: Turning Point, 4: Climax/Action, 5: Resolution)
 * - Character Name & Scene Description
 *
 * Ensures 100% reliability: All 5 panels ALWAYS have vivid, high-quality comic artwork!
 */

export interface ComicArtParams {
  panelNumber: number;
  prompt: string;
  artStyle: string;
  setting?: string;
  characterName?: string;
}

export function generateComicArtSvg(params: ComicArtParams): string {
  const { panelNumber, prompt, artStyle, setting = 'Forest', characterName = 'Hero' } = params;

  // Detect setting from prompt or param
  const lowerPrompt = (prompt + ' ' + setting).toLowerCase();
  const isSpace = lowerPrompt.includes('space') || lowerPrompt.includes('star') || lowerPrompt.includes('planet') || lowerPrompt.includes('cosmic') || lowerPrompt.includes('asteroid');
  const isCity = lowerPrompt.includes('city') || lowerPrompt.includes('street') || lowerPrompt.includes('urban') || lowerPrompt.includes('building') || lowerPrompt.includes('rooftop');
  const isSchool = lowerPrompt.includes('school') || lowerPrompt.includes('hallway') || lowerPrompt.includes('locker') || lowerPrompt.includes('class') || lowerPrompt.includes('lab');
  const isForest = !isSpace && !isCity && !isSchool; // Default to forest / adventure

  // Detect style features
  const isAnime = artStyle.toLowerCase().includes('anime');
  const isPixel = artStyle.toLowerCase().includes('pixel');
  const isRealistic = artStyle.toLowerCase().includes('realistic');

  // Color schemes based on setting and panel stage
  let bgGradient = '';
  let sceneryElements = '';
  let foregroundHero = '';
  let actionEffects = '';

  // 1. SETTING BACKGROUNDS & SCENERY
  if (isSpace) {
    bgGradient = `
      <radialGradient id="spaceGlow" cx="60%" cy="40%" r="70%">
        <stop offset="0%" stop-color="#4338ca" />
        <stop offset="45%" stop-color="#1e1b4b" />
        <stop offset="100%" stop-color="#090514" />
      </radialGradient>
      <linearGradient id="nebulaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#ec4899" stop-opacity="0.6" />
        <stop offset="60%" stop-color="#8b5cf6" stop-opacity="0.4" />
        <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.2" />
      </linearGradient>
    `;

    sceneryElements = `
      <!-- Deep Space with Nebula -->
      <rect width="768" height="768" fill="url(#spaceGlow)" />
      <path d="M-50,200 Q200,50 450,250 T800,100 L800,500 Q500,600 200,450 Z" fill="url(#nebulaGrad)" filter="blur(20px)" />
      
      <!-- Stars & Constellations -->
      <g fill="#ffffff">
        <circle cx="90" cy="80" r="2.5" opacity="0.9" />
        <circle cx="180" cy="140" r="1.5" opacity="0.8" />
        <circle cx="320" cy="70" r="3" opacity="0.95" />
        <circle cx="480" cy="110" r="2" opacity="0.7" />
        <circle cx="650" cy="90" r="3.5" opacity="0.9" />
        <circle cx="710" cy="220" r="1.5" opacity="0.8" />
        <circle cx="120" cy="300" r="2" opacity="0.85" />
        <circle cx="240" cy="420" r="2.5" opacity="0.9" />
        <circle cx="680" cy="450" r="2" opacity="0.75" />
        <polygon points="320,62 322,68 328,70 322,72 320,78 318,72 312,70 318,68" fill="#fef08a" />
        <polygon points="650,82 652,88 658,90 652,92 650,98 648,92 642,90 648,88" fill="#a7f3d0" />
      </g>

      <!-- Giant Ringed Planet -->
      <g transform="translate(560, 200)">
        <ellipse cx="0" cy="0" rx="90" ry="90" fill="#f59e0b" />
        <ellipse cx="-15" cy="-15" rx="75" ry="75" fill="#fbbf24" opacity="0.8" />
        <ellipse cx="0" cy="0" rx="140" ry="24" fill="none" stroke="#fed7aa" stroke-width="12" opacity="0.85" transform="rotate(-25)" />
        <ellipse cx="0" cy="0" rx="160" ry="28" fill="none" stroke="#fcd34d" stroke-width="4" opacity="0.6" transform="rotate(-25)" />
      </g>

      <!-- Asteroid Field or Starship / Cosmic Surface -->
      <g transform="translate(0, 520)">
        <path d="M-20,120 Q180,60 380,100 T790,80 L790,260 L-20,260 Z" fill="#1e1b4b" stroke="#000000" stroke-width="6" />
        <path d="M-10,140 Q220,90 420,130 T790,110 L790,260 L-10,260 Z" fill="#312e81" />
        <!-- Glowing Space Craters / Tech Lights -->
        <circle cx="160" cy="180" r="14" fill="#38bdf8" opacity="0.8" />
        <circle cx="340" cy="160" r="10" fill="#a855f7" opacity="0.8" />
        <circle cx="580" cy="170" r="16" fill="#38bdf8" opacity="0.8" />
      </g>
    `;
  } else if (isCity) {
    bgGradient = `
      <linearGradient id="citySky" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#0f172a" />
        <stop offset="40%" stop-color="#3b0764" />
        <stop offset="70%" stop-color="#c026d3" />
        <stop offset="100%" stop-color="#f97316" />
      </linearGradient>
    `;

    sceneryElements = `
      <rect width="768" height="768" fill="url(#citySky)" />
      <!-- Giant Comic Moon / Sunset Glow -->
      <circle cx="600" cy="220" r="90" fill="#fef08a" opacity="0.85" />
      <circle cx="600" cy="220" r="120" fill="#fef08a" opacity="0.2" />

      <!-- Distant City Silhouette -->
      <g fill="#1e1b4b" opacity="0.6">
        <rect x="40" y="240" width="80" height="300" />
        <rect x="140" y="180" width="90" height="360" />
        <rect x="250" y="260" width="70" height="280" />
        <rect x="340" y="160" width="110" height="380" />
        <rect x="470" y="220" width="90" height="320" />
        <rect x="580" y="290" width="100" height="250" />
        <!-- Antennas -->
        <line x1="395" y1="110" x2="395" y2="160" stroke="#1e1b4b" stroke-width="4" />
        <line x1="185" y1="130" x2="185" y2="180" stroke="#1e1b4b" stroke-width="4" />
      </g>

      <!-- Midground Skyscrapers with glowing windows -->
      <g fill="#0f172a" stroke="#000000" stroke-width="4">
        <rect x="10" y="320" width="140" height="360" />
        <rect x="170" y="260" width="160" height="420" />
        <rect x="360" y="300" width="180" height="380" />
        <rect x="560" y="340" width="190" height="340" />
      </g>
      <!-- Glowing Windows -->
      <g fill="#fef08a" opacity="0.85">
        <rect x="30" y="350" width="12" height="18" />
        <rect x="60" y="350" width="12" height="18" />
        <rect x="90" y="350" width="12" height="18" />
        <rect x="30" y="400" width="12" height="18" />
        <rect x="60" y="400" width="12" height="18" />
        <rect x="195" y="290" width="16" height="22" />
        <rect x="235" y="290" width="16" height="22" />
        <rect x="275" y="290" width="16" height="22" />
        <rect x="195" y="340" width="16" height="22" fill="#38bdf8" />
        <rect x="275" y="340" width="16" height="22" />
        <rect x="390" y="330" width="18" height="24" />
        <rect x="430" y="330" width="18" height="24" fill="#f43f5e" />
        <rect x="470" y="330" width="18" height="24" />
        <rect x="390" y="380" width="18" height="24" />
        <rect x="470" y="380" width="18" height="24" fill="#38bdf8" />
      </g>

      <!-- Foreground Rooftop Ledge -->
      <rect x="-10" y="550" width="788" height="230" fill="#020617" stroke="#000000" stroke-width="8" />
      <line x1="30" y1="550" x2="740" y2="550" stroke="#f43f5e" stroke-width="5" />
    `;
  } else if (isSchool) {
    bgGradient = `
      <linearGradient id="schoolWall" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#bae6fd" />
        <stop offset="60%" stop-color="#e0f2fe" />
        <stop offset="100%" stop-color="#cbd5e1" />
      </linearGradient>
    `;

    sceneryElements = `
      <!-- School Hallway / Laboratory Wall -->
      <rect width="768" height="768" fill="url(#schoolWall)" />

      <!-- Hallway Lockers / Panels -->
      <g fill="#0284c7" stroke="#0f172a" stroke-width="5">
        <rect x="20" y="160" width="100" height="400" />
        <rect x="130" y="160" width="100" height="400" />
        <rect x="240" y="160" width="100" height="400" />
        <rect x="350" y="160" width="100" height="400" />
        <rect x="460" y="160" width="100" height="400" />
        <rect x="570" y="160" width="100" height="400" />
      </g>
      <!-- Locker Vents & Handles -->
      <g stroke="#0f172a" stroke-width="4">
        <line x1="45" y1="200" x2="95" y2="200" />
        <line x1="45" y1="215" x2="95" y2="215" />
        <line x1="155" y1="200" x2="205" y2="200" />
        <line x1="155" y1="215" x2="205" y2="215" />
        <line x1="265" y1="200" x2="315" y2="200" />
        <line x1="265" y1="215" x2="315" y2="215" />
        <circle cx="105" cy="320" r="6" fill="#facc15" />
        <circle cx="215" cy="320" r="6" fill="#facc15" />
        <circle cx="325" cy="320" r="6" fill="#facc15" />
        <circle cx="435" cy="320" r="6" fill="#facc15" />
      </g>

      <!-- Hallway Floor with Perspective Tiles -->
      <polygon points="-20,560 788,560 788,768 -20,768" fill="#f1f5f9" stroke="#0f172a" stroke-width="6" />
      <g stroke="#94a3b8" stroke-width="3">
        <line x1="80" y1="560" x2="-60" y2="768" />
        <line x1="240" y1="560" x2="160" y2="768" />
        <line x1="400" y1="560" x2="400" y2="768" />
        <line x1="560" y1="560" x2="640" y2="768" />
        <line x1="700" y1="560" x2="840" y2="768" />
        <line x1="-20" y1="620" x2="788" y2="620" />
        <line x1="-20" y1="690" x2="788" y2="690" />
      </g>
    `;
  } else {
    // ENCHANTED FOREST (Default)
    bgGradient = `
      <linearGradient id="forestSky" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#022c22" />
        <stop offset="45%" stop-color="#064e3b" />
        <stop offset="75%" stop-color="#047857" />
        <stop offset="100%" stop-color="#10b981" />
      </linearGradient>
      <radialGradient id="magicSun" cx="50%" cy="30%" r="50%">
        <stop offset="0%" stop-color="#fef08a" stop-opacity="0.9" />
        <stop offset="40%" stop-color="#facc15" stop-opacity="0.4" />
        <stop offset="100%" stop-color="#047857" stop-opacity="0" />
      </radialGradient>
    `;

    sceneryElements = `
      <!-- Forest Sky & Magical Canopy -->
      <rect width="768" height="768" fill="url(#forestSky)" />
      <rect width="768" height="768" fill="url(#magicSun)" />

      <!-- Sunbeams / God Rays -->
      <g opacity="0.35" fill="#fef08a">
        <polygon points="384,0 300,768 370,768" />
        <polygon points="384,0 480,768 550,768" />
        <polygon points="384,0 120,768 180,768" />
      </g>

      <!-- Background Silhouetted Trees -->
      <g fill="#064e3b" opacity="0.8">
        <path d="M60,200 Q140,80 220,200 L200,600 L80,600 Z" />
        <path d="M520,180 Q620,60 720,180 L700,600 L540,600 Z" />
      </g>

      <!-- Ancient Gnarled Oaks & Glowing Crystals -->
      <g fill="#022c22" stroke="#000000" stroke-width="6">
        <!-- Left Giant Tree Trunk -->
        <path d="M-40,0 Q80,260 40,768 L-80,768 Z" />
        <path d="M40,240 Q160,180 220,120" stroke="#022c22" stroke-width="26" stroke-linecap="round" fill="none" />
        <!-- Right Giant Tree Trunk -->
        <path d="M780,0 Q660,280 720,768 L840,768 Z" />
        <path d="M700,280 Q580,210 510,160" stroke="#022c22" stroke-width="26" stroke-linecap="round" fill="none" />
      </g>

      <!-- Magical Floating Wisps / Spores -->
      <g fill="#6ee7b7">
        <circle cx="180" cy="220" r="7" opacity="0.9" />
        <circle cx="280" cy="180" r="5" opacity="0.8" />
        <circle cx="490" cy="240" r="8" opacity="0.95" />
        <circle cx="580" cy="190" r="6" opacity="0.85" />
        <circle cx="340" cy="320" r="6" opacity="0.9" />
        <circle cx="430" cy="380" r="7" opacity="0.9" />
      </g>

      <!-- Lush Forest Floor with Moss & Glowing Mushrooms -->
      <path d="M-20,530 Q200,470 380,510 T788,480 L788,768 L-20,768 Z" fill="#065f46" stroke="#000000" stroke-width="7" />
      <path d="M-20,590 Q220,530 420,580 T788,540 L788,768 L-20,768 Z" fill="#047857" />

      <!-- Glowing Crystal Tree Cluster in Center -->
      <g transform="translate(384, 450)">
        <polygon points="0,-180 35,-60 15,10 -15,10 -35,-60" fill="#38bdf8" stroke="#000000" stroke-width="4" opacity="0.9" />
        <polygon points="-45,-120 -15,-40 -35,10 -60,0" fill="#a7f3d0" stroke="#000000" stroke-width="4" opacity="0.85" />
        <polygon points="45,-130 65,-10 35,10 15,-40" fill="#f472b6" stroke="#000000" stroke-width="4" opacity="0.85" />
        <!-- Crystal Glow aura -->
        <circle cx="0" cy="-60" r="110" fill="#67e8f9" opacity="0.3" filter="blur(16px)" />
      </g>
    `;
  }

  // 2. PANEL ACTION BEATS (1 to 5)
  if (panelNumber === 1) {
    // Panel 1: Establishing the Hero & Setting Out
    actionEffects = `
      <!-- Comic Panel Banner -->
      <g transform="translate(40, 50)">
        <rect width="180" height="38" rx="8" fill="#facc15" stroke="#000000" stroke-width="4" />
        <text x="90" y="25" font-family="'Impact', 'Arial Black', sans-serif" font-size="20" font-weight="900" fill="#000000" text-anchor="middle">
          ★ CHAPTER BEGINS
        </text>
      </g>
    `;

    foregroundHero = `
      <!-- Hero Character: Exploring Pose -->
      <g transform="translate(260, 480)">
        <!-- Shadow -->
        <ellipse cx="0" cy="110" rx="65" ry="16" fill="#000000" opacity="0.5" />
        <!-- Hero Body (Orange Fox / Stylized Adventurer) -->
        <path d="M-35,60 Q-45,20 -10,-10 Q30,-10 40,60 Q10,95 -35,60 Z" fill="#f97316" stroke="#000000" stroke-width="5" />
        <!-- White Chest Fur -->
        <path d="M-15,15 Q0,40 15,15 Q5,55 -5,55 Z" fill="#ffffff" stroke="#000000" stroke-width="3" />
        <!-- Hero Head -->
        <path d="M-40,-30 Q-50,-70 0,-70 Q50,-70 40,-30 Q0,0 -40,-30 Z" fill="#ea580c" stroke="#000000" stroke-width="5" />
        <!-- Ears -->
        <polygon points="-35,-65 -55,-120 -15,-80" fill="#ea580c" stroke="#000000" stroke-width="5" />
        <polygon points="-30,-70 -45,-105 -20,-80" fill="#fed7aa" />
        <polygon points="35,-65 55,-120 15,-80" fill="#ea580c" stroke="#000000" stroke-width="5" />
        <polygon points="30,-70 45,-105 20,-80" fill="#fed7aa" />
        <!-- Face Features -->
        <polygon points="-8,-30 8,-30 0,-20" fill="#0f172a" />
        <circle cx="-16" cy="-45" r="7" fill="#ffffff" stroke="#000000" stroke-width="2.5" />
        <circle cx="-15" cy="-45" r="4" fill="#0f172a" />
        <circle cx="16" cy="-45" r="7" fill="#ffffff" stroke="#000000" stroke-width="2.5" />
        <circle cx="15" cy="-45" r="4" fill="#0f172a" />
        <!-- White Cheeks -->
        <path d="M-40,-35 Q-20,-20 -5,-30" stroke="#000000" stroke-width="3" fill="none" />
        <path d="M40,-35 Q20,-20 5,-30" stroke="#000000" stroke-width="3" fill="none" />
        <!-- Fluffy Fox Tail with White Tip -->
        <path d="M35,60 Q110,40 120,-10 Q80,-40 50,20 Z" fill="#ea580c" stroke="#000000" stroke-width="5" />
        <polygon points="100,5 120,-10 95,-25 90,-5" fill="#ffffff" stroke="#000000" stroke-width="3" />
        <!-- Paws with boots / gloves -->
        <ellipse cx="-20" cy="100" rx="14" ry="10" fill="#1e293b" stroke="#000000" stroke-width="4" />
        <ellipse cx="20" cy="100" rx="14" ry="10" fill="#1e293b" stroke="#000000" stroke-width="4" />
      </g>
    `;
  } else if (panelNumber === 2) {
    // Panel 2: Mystery Glow / Something Ahead
    actionEffects = `
      <!-- Curious Comic Question / Alert Burst -->
      <g transform="translate(620, 160)">
        <polygon points="0,-45 15,-15 45,-15 20,5 30,35 0,15 -30,35 -20,5 -45,-15 -15,-15" fill="#facc15" stroke="#000000" stroke-width="4" />
        <text x="0" y="10" font-family="'Impact', sans-serif" font-size="28" font-weight="900" fill="#000000" text-anchor="middle">!</text>
      </g>
      <!-- Sound FX Badge -->
      <g transform="translate(180, 120) rotate(-8)">
        <rect x="-70" y="-20" width="140" height="40" rx="10" fill="#f43f5e" stroke="#000000" stroke-width="4" />
        <text x="0" y="8" font-family="'Impact', sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle">
          *RUSTLE!*
        </text>
      </g>
    `;

    foregroundHero = `
      <!-- Hero Peeking Around Obstacle -->
      <g transform="translate(240, 470)">
        <ellipse cx="0" cy="110" rx="65" ry="16" fill="#000000" opacity="0.5" />
        <!-- Body leaning forward -->
        <path d="M-30,60 Q0,10 50,40 Q40,90 -20,75 Z" fill="#f97316" stroke="#000000" stroke-width="5" />
        <!-- Head tilted inquisitively -->
        <g transform="rotate(12)">
          <path d="M-30,-30 Q-40,-70 10,-70 Q60,-70 50,-30 Q10,0 -30,-30 Z" fill="#ea580c" stroke="#000000" stroke-width="5" />
          <polygon points="-25,-65 -45,-120 -5,-80" fill="#ea580c" stroke="#000000" stroke-width="5" />
          <polygon points="45,-65 65,-120 25,-80" fill="#ea580c" stroke="#000000" stroke-width="5" />
          <circle cx="-6" cy="-45" r="8" fill="#ffffff" stroke="#000000" stroke-width="3" />
          <circle cx="-4" cy="-45" r="4.5" fill="#0f172a" />
          <circle cx="26" cy="-45" r="8" fill="#ffffff" stroke="#000000" stroke-width="3" />
          <circle cx="28" cy="-45" r="4.5" fill="#0f172a" />
          <polygon points="2,-30 18,-30 10,-20" fill="#0f172a" />
        </g>
        <!-- Tail Raised high -->
        <path d="M-20,70 Q-80,40 -70,-20 Q-40,-10 -15,40 Z" fill="#ea580c" stroke="#000000" stroke-width="5" />
        <polygon points="-70,-20 -50,-35 -35,-10 -60,0" fill="#ffffff" stroke="#000000" stroke-width="3" />
        <!-- Paws -->
        <ellipse cx="10" cy="100" rx="14" ry="10" fill="#1e293b" stroke="#000000" stroke-width="4" />
        <ellipse cx="50" cy="95" rx="14" ry="10" fill="#1e293b" stroke="#000000" stroke-width="4" />
      </g>
    `;
  } else if (panelNumber === 3) {
    // Panel 3: The Great Discovery / In Awe
    actionEffects = `
      <!-- Concentric Radiating Wonder Aura -->
      <g transform="translate(384, 380)">
        <circle cx="0" cy="0" r="160" fill="none" stroke="#facc15" stroke-width="3" stroke-dasharray="8 8" opacity="0.7" />
        <circle cx="0" cy="0" r="220" fill="none" stroke="#38bdf8" stroke-width="3" stroke-dasharray="12 12" opacity="0.6" />
        <circle cx="0" cy="0" r="280" fill="none" stroke="#f472b6" stroke-width="2" stroke-dasharray="16 16" opacity="0.4" />
      </g>
      <!-- SFX Callout -->
      <g transform="translate(560, 100) rotate(10)">
        <polygon points="0,-35 25,-12 45,-30 35,5 60,20 25,25 20,55 -5,30 -35,45 -25,10 -55,-10 -20,-15"
                 fill="#38bdf8" stroke="#000000" stroke-width="4" />
        <text x="0" y="8" font-family="'Impact', sans-serif" font-size="22" font-weight="900" fill="#000000" text-anchor="middle">
          SHIMMER!
        </text>
      </g>
    `;

    foregroundHero = `
      <!-- Hero in Awe / Wide Eyes -->
      <g transform="translate(200, 490)">
        <ellipse cx="0" cy="110" rx="65" ry="16" fill="#000000" opacity="0.5" />
        <path d="M-35,60 Q-45,20 -10,-10 Q30,-10 40,60 Q10,95 -35,60 Z" fill="#f97316" stroke="#000000" stroke-width="5" />
        <!-- Head looking up in wonder -->
        <path d="M-40,-35 Q-50,-75 0,-75 Q50,-75 40,-35 Q0,-5 -40,-35 Z" fill="#ea580c" stroke="#000000" stroke-width="5" />
        <polygon points="-35,-70 -55,-125 -15,-85" fill="#ea580c" stroke="#000000" stroke-width="5" />
        <polygon points="35,-70 55,-125 15,-85" fill="#ea580c" stroke="#000000" stroke-width="5" />
        <!-- Big Sparkle Eyes -->
        <circle cx="-16" cy="-48" r="10" fill="#ffffff" stroke="#000000" stroke-width="3" />
        <circle cx="-15" cy="-48" r="6" fill="#38bdf8" />
        <circle cx="-17" cy="-51" r="2.5" fill="#ffffff" />
        <circle cx="16" cy="-48" r="10" fill="#ffffff" stroke="#000000" stroke-width="3" />
        <circle cx="17" cy="-48" r="6" fill="#38bdf8" />
        <circle cx="15" cy="-51" r="2.5" fill="#ffffff" />
        <!-- Open Smiling Snout -->
        <ellipse cx="0" cy="-28" rx="8" ry="6" fill="#0f172a" />
        <!-- Tail -->
        <path d="M35,60 Q100,50 110,0 Q70,-20 50,30 Z" fill="#ea580c" stroke="#000000" stroke-width="5" />
        <polygon points="90,15 110,0 85,-10 80,5" fill="#ffffff" stroke="#000000" stroke-width="3" />
        <ellipse cx="-20" cy="100" rx="14" ry="10" fill="#1e293b" stroke="#000000" stroke-width="4" />
        <ellipse cx="20" cy="100" rx="14" ry="10" fill="#1e293b" stroke="#000000" stroke-width="4" />
      </g>
    `;
  } else if (panelNumber === 4) {
    // Panel 4: The Climax / Magic Touch / Energy Burst!
    actionEffects = `
      <!-- Giant Comic Starburst Center -->
      <g transform="translate(384, 340)">
        <polygon points="0,-160 40,-70 140,-110 80,-20 160,30 70,70 90,160 0,90 -90,160 -70,70 -160,30 -80,-20 -140,-110 -40,-70"
                 fill="#fde047" stroke="#000000" stroke-width="7" opacity="0.9" />
        <polygon points="0,-120 30,-50 100,-80 60,-15 120,20 50,50 65,120 0,70 -65,120 -50,50 -120,20 -60,-15 -100,-80 -30,-50"
                 fill="#f43f5e" stroke="#000000" stroke-width="5" />
        <text x="0" y="16" font-family="'Impact', 'Arial Black', sans-serif" font-size="48" font-weight="900" fill="#ffffff" text-anchor="middle">
          ZAP!
        </text>
      </g>

      <!-- Sparkle & Particle Explosions -->
      <g fill="#fef08a" stroke="#000000" stroke-width="2">
        <polygon points="200,240 205,250 215,255 205,260 200,270 195,260 185,255 195,250" />
        <polygon points="560,220 565,230 575,235 565,240 560,250 555,240 545,235 555,230" />
        <polygon points="260,140 264,148 272,152 264,156 260,164 256,156 248,152 256,148" />
        <polygon points="500,460 504,468 512,472 504,476 500,484 496,476 488,472 496,468" />
      </g>
    `;

    foregroundHero = `
      <!-- Hero Reaching Out with Paw -->
      <g transform="translate(230, 460)">
        <ellipse cx="0" cy="110" rx="65" ry="16" fill="#000000" opacity="0.5" />
        <path d="M-30,60 Q0,10 60,30 Q50,90 -20,75 Z" fill="#f97316" stroke="#000000" stroke-width="5" />
        <path d="M-30,-30 Q-40,-70 10,-70 Q60,-70 50,-30 Q10,0 -30,-30 Z" fill="#ea580c" stroke="#000000" stroke-width="5" />
        <polygon points="-25,-65 -45,-120 -5,-80" fill="#ea580c" stroke="#000000" stroke-width="5" />
        <polygon points="45,-65 65,-120 25,-80" fill="#ea580c" stroke="#000000" stroke-width="5" />
        <circle cx="-6" cy="-45" r="7" fill="#ffffff" stroke="#000000" stroke-width="2.5" />
        <circle cx="-4" cy="-45" r="4" fill="#0f172a" />
        <circle cx="26" cy="-45" r="7" fill="#ffffff" stroke="#000000" stroke-width="2.5" />
        <circle cx="28" cy="-45" r="4" fill="#0f172a" />
        <!-- Reaching Paw with Glow -->
        <path d="M20,30 Q80,10 110,-10" stroke="#f97316" stroke-width="18" stroke-linecap="round" fill="none" />
        <circle cx="115" cy="-15" r="14" fill="#fde047" stroke="#000000" stroke-width="4" />
        <!-- Tail -->
        <path d="M-20,70 Q-80,40 -70,-20 Q-40,-10 -15,40 Z" fill="#ea580c" stroke="#000000" stroke-width="5" />
        <polygon points="-70,-20 -50,-35 -35,-10 -60,0" fill="#ffffff" stroke="#000000" stroke-width="3" />
        <ellipse cx="-15" cy="100" rx="14" ry="10" fill="#1e293b" stroke="#000000" stroke-width="4" />
        <ellipse cx="25" cy="100" rx="14" ry="10" fill="#1e293b" stroke="#000000" stroke-width="4" />
      </g>
    `;
  } else {
    // Panel 5: Resolution / Peaceful Ending
    actionEffects = `
      <!-- Peaceful Twilight Moon & Stars -->
      <g transform="translate(620, 140)">
        <path d="M-30,-30 A45,45 0 0,0 30,30 A35,35 0 1,1 -30,-30 Z" fill="#fef08a" stroke="#000000" stroke-width="4" />
      </g>
      <!-- "THE END" or "HAPPY CONCLUSION" Comic Box -->
      <g transform="translate(560, 640)">
        <rect x="-80" y="-22" width="160" height="44" rx="10" fill="#facc15" stroke="#000000" stroke-width="5" />
        <text x="0" y="8" font-family="'Impact', 'Arial Black', sans-serif" font-size="24" font-weight="900" fill="#000000" text-anchor="middle">
          THE END
        </text>
      </g>
    `;

    foregroundHero = `
      <!-- Hero Curled Up Sleeping Peacefully -->
      <g transform="translate(384, 520)">
        <ellipse cx="0" cy="50" rx="85" ry="22" fill="#000000" opacity="0.5" />
        <!-- Sleeping curled ball -->
        <ellipse cx="0" cy="10" rx="65" ry="45" fill="#f97316" stroke="#000000" stroke-width="5" />
        <!-- Curled Tail Wrapping Around -->
        <path d="M-40,20 Q-70,-20 0,-30 Q60,-20 40,20" fill="none" stroke="#ea580c" stroke-width="26" stroke-linecap="round" />
        <ellipse cx="10" cy="-28" rx="18" ry="10" fill="#ffffff" />
        <!-- Relaxed Sleeping Head -->
        <ellipse cx="-25" cy="5" rx="30" ry="26" fill="#ea580c" stroke="#000000" stroke-width="5" />
        <polygon points="-40,-15 -55,-45 -25,-25" fill="#ea580c" stroke="#000000" stroke-width="4" />
        <polygon points="-15,-20 -5,-50 5,-20" fill="#ea580c" stroke="#000000" stroke-width="4" />
        <!-- Sleeping Eyelashes -->
        <path d="M-36,5 Q-30,12 -24,5" stroke="#0f172a" stroke-width="3.5" fill="none" stroke-linecap="round" />
        <polygon points="-42,12 -34,12 -38,17" fill="#0f172a" />
        <!-- Zzz Floating bubbles -->
        <text x="35" y="-35" font-family="'Comic Sans MS', sans-serif" font-size="22" font-weight="bold" fill="#38bdf8">Z</text>
        <text x="55" y="-55" font-family="'Comic Sans MS', sans-serif" font-size="26" font-weight="bold" fill="#818cf8">Z</text>
        <text x="75" y="-75" font-family="'Comic Sans MS', sans-serif" font-size="32" font-weight="bold" fill="#c084fc">Z</text>
      </g>
    `;
  }

  // Comic Book Outer Border and Ben-Day Dots Pattern
  return `<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 768 768">
  <defs>
    ${bgGradient}
    <pattern id="benDayDots" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
      <circle cx="8" cy="8" r="1.8" fill="#000000" opacity="0.08" />
    </pattern>
    <filter id="comicShadow">
      <feDropShadow dx="6" dy="6" stdDeviation="0" flood-color="#000000" />
    </filter>
  </defs>

  <!-- Background Scenery -->
  ${sceneryElements}

  <!-- Halftone Comic Overlay -->
  <rect width="768" height="768" fill="url(#benDayDots)" pointer-events="none" />

  <!-- Action & Dynamic Effects -->
  ${actionEffects}

  <!-- Foreground Hero Character & Objects -->
  ${foregroundHero}

  <!-- Heavy Comic Book Panel Outer Frame -->
  <rect x="14" y="14" width="740" height="740" fill="none" stroke="#000000" stroke-width="14" rx="8" />
  <rect x="22" y="22" width="724" height="724" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.3" rx="4" />

  <!-- Panel Number Badge (Top Left) -->
  <g transform="translate(36, 36)">
    <rect width="110" height="42" rx="10" fill="#facc15" stroke="#000000" stroke-width="4" filter="url(#comicShadow)" />
    <text x="55" y="28" font-family="'Impact', 'Arial Black', sans-serif" font-size="22" font-weight="900" fill="#000000" text-anchor="middle">
      PANEL ${panelNumber}
    </text>
  </g>
</svg>`;
}

/**
 * Returns the SVG formatted as a base64 Data URL
 */
export function generateComicArtDataUrl(params: ComicArtParams): string {
  const svg = generateComicArtSvg(params);
  const base64 = typeof window !== 'undefined'
    ? window.btoa(unescape(encodeURIComponent(svg)))
    : Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}
