import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  FileText,
  PlusCircle,
  Download,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { ComicPanelLayout, ComicMetadata } from '../../services/types';
import { savePdf } from '../../services/exporters';

interface ExportSuccessPageProps {
  filename: string;
  metadata: ComicMetadata;
  layout: ComicPanelLayout[];
  onReset: () => void;
  onViewMyComics?: () => void;
}

export const ExportSuccessPage: React.FC<ExportSuccessPageProps> = ({
  filename,
  metadata,
  layout,
  onReset,
  onViewMyComics,
}) => {
  useEffect(() => {
    // Fire celebratory confetti!
    try {
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
      };

      function fire(particleRatio: number, opts: confetti.Options) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      }

      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });
      fire(0.2, {
        spread: 60,
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    } catch (e) {
      console.warn('Confetti error:', e);
    }
  }, []);

  const handleDownloadAgain = async () => {
    await savePdf(layout, metadata);
  };

  return (
    <div className="min-h-[calc(100vh-70px)] py-12 px-4 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background with comic halftone */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-yellow-100 to-rose-100 comic-dots-pattern-subtle -z-10" />

      <div className="w-full max-w-xl text-center">
        {/* Victory Burst Badge */}
        <div className="inline-block transform -rotate-2 mb-4">
          <div className="bg-yellow-400 text-slate-950 font-comic text-2xl md:text-3xl px-6 py-2 rounded-2xl comic-border-thick comic-shadow animate-bounce">
            🎉 POW! COMIC EXPORTED!
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl comic-border-thick comic-shadow-lg p-6 sm:p-8 text-center relative">
          <div className="w-16 h-16 bg-emerald-100 rounded-full comic-border flex items-center justify-center mx-auto mb-4 comic-shadow-sm">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>

          <h2 className="font-comic text-3xl sm:text-4xl text-slate-950 mb-2">
            Downloaded Successfully!
          </h2>

          <p className="text-sm sm:text-base font-comic-body font-medium text-slate-600 mb-4">
            Your 5-panel comic strip has been compiled and saved to your device.
          </p>

          {/* Saved in local storage note */}
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-900 border border-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-bold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Saved to your browser's "My Comics" library</span>
          </div>

          {/* Filename callout box */}
          <div className="bg-amber-50 border-2 border-slate-900 rounded-2xl p-4 mb-6 flex items-center justify-between gap-3 text-left comic-shadow-sm">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 bg-rose-500 rounded-xl comic-border flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="truncate">
                <div className="text-[11px] font-bold uppercase text-slate-500">
                  PDF Filename:
                </div>
                <div className="font-mono text-sm font-bold text-slate-900 truncate">
                  {filename}
                </div>
              </div>
            </div>

            <button
              onClick={handleDownloadAgain}
              className="p-2.5 bg-yellow-400 hover:bg-yellow-300 rounded-xl comic-border comic-shadow-sm hover:scale-105 active:scale-95 transition-all text-slate-900 shrink-0 cursor-pointer"
              title="Download Again"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          {/* 5-panel miniature strip preview */}
          {layout.length > 0 && (
            <div className="mb-6">
              <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                Strip Panels Preview
              </div>
              <div className="grid grid-cols-5 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                {layout.map((p) => (
                  <div key={p.panelNumber} className="relative aspect-square rounded-lg overflow-hidden border border-slate-800">
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0.5 right-0.5 bg-yellow-400 text-slate-950 font-bold text-[9px] px-1 rounded">
                      #{p.panelNumber}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={onReset}
              className="w-full py-4 px-6 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-comic text-2xl tracking-wide rounded-2xl comic-border-thick comic-shadow hover:translate-y-[-2px] hover:comic-shadow-lg active:translate-y-[1px] transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <PlusCircle className="w-6 h-6" />
              <span>Go Create Another Comic</span>
            </button>

            {onViewMyComics && (
              <button
                type="button"
                onClick={onViewMyComics}
                className="w-full py-3 px-6 bg-white hover:bg-slate-50 text-slate-900 font-comic text-lg tracking-wide rounded-2xl comic-border comic-shadow-sm hover:translate-y-[-1px] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Layers className="w-5 h-5 text-amber-500" />
                <span>Browse in 'My Comics'</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
