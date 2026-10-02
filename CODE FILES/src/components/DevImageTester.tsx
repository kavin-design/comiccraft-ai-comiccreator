import React, { useState } from 'react';
import { Wrench, ChevronDown, ChevronUp, Image as ImageIcon, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { generateImage, CURRENT_GEMINI_IMAGE_MODEL } from '../../services/imageGenerator';
import { ART_STYLES, ArtStyle } from '../../config';

export const DevImageTester: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('A brave steampunk raccoon wearing brass goggles in a futuristic clockwork tower');
  const [artStyle, setArtStyle] = useState<ArtStyle>('Comic Book');
  const [panelNumber, setPanelNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number | null>(null);

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setStatusMsg(`Testing generateImage() with model ${CURRENT_GEMINI_IMAGE_MODEL} and Pollinations fallback...`);
    setResultImage(null);
    const start = performance.now();

    try {
      const imgUrl = await generateImage(prompt, artStyle, panelNumber);
      const elapsed = Math.round(performance.now() - start);
      setElapsedTime(elapsed);
      setResultImage(imgUrl);

      let source = 'pollinations';
      if (imgUrl.startsWith('data:image/svg')) {
        source = 'SVG Placeholder';
      } else if (imgUrl.includes('base64')) {
        source = 'Gemini / Pollinations (Base64)';
      }
      setStatusMsg(`Success! Generated in ${elapsed}ms via ${source}`);
    } catch (err: any) {
      console.error('Test image error:', err);
      setStatusMsg(`Error: ${err.message || 'Image generation failed'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 border-2 border-dashed border-slate-400 bg-amber-50/70 rounded-2xl p-4 transition-all">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left font-bold text-slate-700 hover:text-slate-900 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-200 rounded-lg">
            <Wrench className="w-4 h-4 text-slate-700" />
          </div>
          <span className="font-comic text-lg text-slate-900">Developer Tools: Test Image Generator</span>
          <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
            generateImage()
          </span>
        </div>
        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-300">
          <p className="text-xs text-slate-600 mb-3">
            Standalone sandbox to test <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800">services/imageGenerator.ts</code>.
            Evaluates Gemini image generation ({CURRENT_GEMINI_IMAGE_MODEL}), Pollinations fallback, and SVG generation without running the full 5-panel pipeline.
          </p>

          <form onSubmit={handleTest} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Visual Prompt:
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                className="w-full text-sm p-2 rounded-lg border-2 border-slate-300 focus:border-slate-800 focus:outline-none bg-white"
                placeholder="Enter prompt for single image..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Art Style:
                </label>
                <select
                  value={artStyle}
                  onChange={(e) => setArtStyle(e.target.value as ArtStyle)}
                  className="w-full text-xs p-2 rounded-lg border-2 border-slate-300 focus:border-slate-800 bg-white font-medium"
                >
                  {ART_STYLES.map((style) => (
                    <option key={style} value={style}>
                      {style}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Panel Number:
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={panelNumber}
                  onChange={(e) => setPanelNumber(Number(e.target.value))}
                  className="w-full text-xs p-2 rounded-lg border-2 border-slate-300 focus:border-slate-800 bg-white font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 active:scale-98 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  Generating Test Image...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Run generateImage() Alone
                </>
              )}
            </button>
          </form>

          {statusMsg && (
            <div className="mt-3 p-2.5 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {resultImage && (
            <div className="mt-4 bg-white p-3 rounded-xl border-2 border-slate-900 comic-shadow-sm flex flex-col items-center">
              <div className="relative w-full max-w-xs aspect-square rounded-lg overflow-hidden border-2 border-slate-900">
                <img
                  src={resultImage}
                  alt="Generated single test panel"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-2 text-center text-xs text-slate-500 font-mono">
                {elapsedTime ? `${elapsedTime}ms • Base64 Data URL length: ${resultImage.length} chars` : ''}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
