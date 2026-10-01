import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Wand2,
  BookOpen,
  MapPin,
  Smile,
  Palette,
  User,
  Lightbulb,
} from 'lucide-react';
import { SETTINGS, STORY_TONES, ART_STYLES, ComicSetting, StoryTone, ArtStyle } from '../../config';
import type { ComicInput } from '../../services/types';
import { DevImageTester } from './DevImageTester';

interface HomePageProps {
  initialValues: ComicInput;
  onSubmit: (input: ComicInput) => void;
}

const PRESET_IDEAS = [
  {
    name: 'Barnaby',
    prompt: 'A brave fox exploring an enchanted forest finds a glowing crystal tree guarded by friendly wisps',
    setting: 'Forest' as ComicSetting,
    tone: 'Light-hearted' as StoryTone,
    style: 'Comic Book' as ArtStyle,
  },
  {
    name: 'Captain Whiskers',
    prompt: 'A daring calico space cat piloting a starship avoids giant cheese asteroids and saves a stranded mouse',
    setting: 'Space' as ComicSetting,
    tone: 'Funny' as StoryTone,
    style: 'Anime' as ArtStyle,
  },
  {
    name: 'Maya',
    prompt: 'A clever middle school inventor uncovers a hidden underground clockwork laboratory beneath the gym lockers',
    setting: 'School' as ComicSetting,
    tone: 'Dramatic' as StoryTone,
    style: 'Pixel Art' as ArtStyle,
  },
  {
    name: 'Rocco the Pigeon',
    prompt: 'A streetwise city pigeon in trench coat solves the mystery of the missing bakery sourdough baguette',
    setting: 'City' as ComicSetting,
    tone: 'Poetic' as StoryTone,
    style: 'Realistic' as ArtStyle,
  },
];

export const HomePage: React.FC<HomePageProps> = ({ initialValues, onSubmit }) => {
  const [prompt, setPrompt] = useState(initialValues.prompt || '');
  const [characterName, setCharacterName] = useState(initialValues.characterName || '');
  const [setting, setSetting] = useState<ComicSetting>((initialValues.setting as ComicSetting) || 'Forest');
  const [storyTone, setStoryTone] = useState<StoryTone>((initialValues.storyTone as StoryTone) || 'Light-hearted');
  const [artStyle, setArtStyle] = useState<ArtStyle>((initialValues.artStyle as ArtStyle) || 'Comic Book');

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleApplyPreset = (preset: (typeof PRESET_IDEAS)[0]) => {
    setCharacterName(preset.name);
    setPrompt(preset.prompt);
    setSetting(preset.setting);
    setStoryTone(preset.tone);
    setArtStyle(preset.style);
    setValidationError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedPrompt = prompt.trim();
    const trimmedName = characterName.trim();

    if (!trimmedPrompt) {
      setValidationError('Please enter a story prompt for your comic!');
      return;
    }

    if (!trimmedName) {
      setValidationError('Please enter a name for your main character!');
      return;
    }

    if (trimmedPrompt.length > 500) {
      setValidationError(`Prompt must be 500 characters or fewer (currently ${trimmedPrompt.length}).`);
      return;
    }

    setValidationError(null);
    onSubmit({
      prompt: trimmedPrompt,
      characterName: trimmedName,
      setting,
      storyTone,
      artStyle,
    });
  };

  const charCount = prompt.length;
  const isOverLimit = charCount > 500;

  return (
    <div className="relative min-h-[calc(100vh-70px)] py-10 px-4 flex flex-col items-center justify-center overflow-hidden">
      {/* Scenic Colorful Background with Sunburst & Halftone Dots */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-rose-100 to-sky-100 comic-dots-pattern-subtle -z-10" />

      {/* Floating decorative comic badges in background */}
      <div className="hidden lg:block absolute top-14 left-10 transform -rotate-12 bg-yellow-300 text-slate-900 font-comic text-2xl px-4 py-2 rounded-2xl comic-border comic-shadow opacity-80 pointer-events-none">
        💥 BAM! 5 PANELS!
      </div>
      <div className="hidden lg:block absolute bottom-20 right-10 transform rotate-6 bg-pink-400 text-white font-comic text-2xl px-4 py-2 rounded-2xl comic-border comic-shadow opacity-80 pointer-events-none">
        ✨ INSTANT PDF!
      </div>

      <div className="w-full max-w-2xl">
        {/* Hero Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 font-comic text-sm md:text-base px-4 py-1.5 rounded-full comic-border comic-shadow-sm mb-3 transform -rotate-1">
            <Sparkles className="w-4 h-4" />
            <span>AI-POWERED STORYTELLER & ILLUSTRATOR</span>
          </div>
          <h1 className="font-comic text-4xl sm:text-5xl md:text-6xl text-slate-950 tracking-wide drop-shadow-xs">
            CREATE YOUR COMIC STRIP
          </h1>
          <p className="text-base sm:text-lg font-medium text-slate-700 max-w-lg mx-auto mt-2 font-comic-body">
            Turn your wildest narrative idea into a colorful 5-panel comic strip with outline, character dialogue, and illustrated panels!
          </p>
        </div>

        {/* Prompt Idea Chips */}
        <div className="mb-6 bg-white/70 backdrop-blur-xs p-3.5 rounded-2xl border-2 border-slate-900/20">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>Need inspiration? Try a story spark:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESET_IDEAS.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(item)}
                className="text-xs font-semibold px-3 py-1.5 bg-white hover:bg-amber-100 text-slate-800 rounded-xl border border-slate-300 hover:border-slate-800 transition-all hover:scale-102 active:scale-98"
              >
                ★ {item.name}: {item.prompt.slice(0, 32)}...
              </button>
            ))}
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-3xl comic-border-thick comic-shadow-lg p-6 sm:p-8 relative">
          {validationError && (
            <div className="mb-6 p-3.5 bg-rose-100 border-2 border-rose-600 rounded-xl text-sm font-bold text-rose-800 flex items-center gap-2">
              <Zap className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Story Prompt */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="flex items-center gap-2 font-comic text-lg text-slate-900">
                  <BookOpen className="w-5 h-5 text-amber-500" />
                  <span>Story Prompt</span>
                  <span className="text-rose-500 text-sm font-bold">*</span>
                </label>
                <span
                  className={`text-xs font-mono font-bold ${
                    isOverLimit ? 'text-rose-600' : 'text-slate-500'
                  }`}
                >
                  {charCount}/500 chars
                </span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                rows={3}
                placeholder="A brave fox exploring an enchanted forest..."
                className={`w-full p-3.5 rounded-2xl border-2 font-comic-body text-base text-slate-900 bg-amber-50/40 focus:bg-white placeholder:text-slate-400 focus:outline-none transition-all ${
                  isOverLimit
                    ? 'border-rose-500 focus:border-rose-600'
                    : 'border-slate-300 focus:border-slate-900'
                }`}
                required
              />
              <p className="text-xs text-slate-500 mt-1 font-comic-body">
                Tip: Describe what your hero discovers, faces, or accomplishes!
              </p>
            </div>

            {/* Character Name */}
            <div>
              <label className="flex items-center gap-2 font-comic text-lg text-slate-900 mb-1.5">
                <User className="w-5 h-5 text-indigo-500" />
                <span>Main Character Name</span>
                <span className="text-rose-500 text-sm font-bold">*</span>
              </label>
              <input
                type="text"
                value={characterName}
                onChange={(e) => {
                  setCharacterName(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="e.g. Barnaby the Fox, Nova, Officer Whiskers"
                className="w-full p-3.5 rounded-2xl border-2 border-slate-300 focus:border-slate-900 font-comic-body text-base text-slate-900 bg-amber-50/40 focus:bg-white placeholder:text-slate-400 focus:outline-none transition-all"
                required
              />
            </div>

            {/* 3 Dropdowns Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Setting */}
              <div>
                <label className="flex items-center gap-1.5 font-comic text-base text-slate-900 mb-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Setting</span>
                </label>
                <div className="relative">
                  <select
                    value={setting}
                    onChange={(e) => setSetting(e.target.value as ComicSetting)}
                    className="w-full p-3 pr-8 rounded-2xl border-2 border-slate-300 focus:border-slate-900 font-bold text-sm text-slate-800 bg-white focus:outline-none appearance-none cursor-pointer"
                  >
                    {SETTINGS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-bold text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* Story Tone */}
              <div>
                <label className="flex items-center gap-1.5 font-comic text-base text-slate-900 mb-1.5">
                  <Smile className="w-4 h-4 text-amber-500" />
                  <span>Story Tone</span>
                </label>
                <div className="relative">
                  <select
                    value={storyTone}
                    onChange={(e) => setStoryTone(e.target.value as StoryTone)}
                    className="w-full p-3 pr-8 rounded-2xl border-2 border-slate-300 focus:border-slate-900 font-bold text-sm text-slate-800 bg-white focus:outline-none appearance-none cursor-pointer"
                  >
                    {STORY_TONES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-bold text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* Art Style */}
              <div>
                <label className="flex items-center gap-1.5 font-comic text-base text-slate-900 mb-1.5">
                  <Palette className="w-4 h-4 text-rose-500" />
                  <span>Art Style</span>
                </label>
                <div className="relative">
                  <select
                    value={artStyle}
                    onChange={(e) => setArtStyle(e.target.value as ArtStyle)}
                    className="w-full p-3 pr-8 rounded-2xl border-2 border-slate-300 focus:border-slate-900 font-bold text-sm text-slate-800 bg-white focus:outline-none appearance-none cursor-pointer"
                  >
                    {ART_STYLES.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 font-bold text-xs">
                    ▼
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isOverLimit}
                className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-comic text-2xl tracking-wider rounded-2xl comic-border-thick comic-shadow hover:translate-x-[-2px] hover:translate-y-[-2px] hover:comic-shadow-lg active:translate-x-[2px] active:translate-y-[2px] active:comic-shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <Wand2 className="w-6 h-6 text-slate-950 group-hover:rotate-12 transition-transform" />
                <span>GENERATE MY COMIC</span>
              </button>
            </div>
          </form>

          {/* Developer Tools Image Sandbox */}
          <DevImageTester />
        </div>
      </div>
    </div>
  );
};
