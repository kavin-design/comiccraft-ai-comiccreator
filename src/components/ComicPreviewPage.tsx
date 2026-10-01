import React, { useState } from 'react';
import {
  Download,
  RotateCcw,
  Sparkles,
  BookOpen,
  Volume2,
  MessageSquare,
  HelpCircle,
  Loader2,
  Maximize2,
  X,
} from 'lucide-react';
import type { ComicPanelLayout, ComicMetadata } from '../../services/types';
import { savePdf } from '../../services/exporters';

interface ComicPreviewPageProps {
  layout: ComicPanelLayout[];
  metadata: ComicMetadata;
  onRegenerate: () => void;
  onExportSuccess: (filename: string) => void;
  onViewMyComics?: () => void;
}

export const ComicPreviewPage: React.FC<ComicPreviewPageProps> = ({
  layout,
  metadata,
  onRegenerate,
  onExportSuccess,
  onViewMyComics,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);

  const handleDownloadPdf = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      // Calls savePdf which triggers download and returns filename
      const filename = await savePdf(layout, metadata);
      // Navigate to export success page
      onExportSuccess(filename);
    } catch (err: any) {
      console.error('Failed to generate PDF:', err);
      alert(`Could not generate PDF: ${err.message || 'Unknown error'}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 max-w-4xl mx-auto">
      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-2xl w-full bg-white p-3 rounded-2xl comic-border-thick comic-shadow-lg" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-4 -right-4 bg-rose-500 text-white p-2 rounded-full comic-border comic-shadow-sm hover:scale-110 transition-transform cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedImage.url}
              alt={selectedImage.title}
              className="w-full h-auto rounded-xl object-contain max-h-[80vh]"
            />
            <p className="text-center font-comic text-xl text-slate-900 mt-2">
              {selectedImage.title}
            </p>
          </div>
        </div>
      )}

      {/* Comic Header Card */}
      <div className="bg-white rounded-3xl comic-border-thick comic-shadow-lg p-6 sm:p-8 mb-10 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400" />

        <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
          <div className="inline-flex items-center gap-1.5 bg-amber-300 text-slate-950 font-comic text-sm px-4 py-1 rounded-full comic-border comic-shadow-sm">
            <BookOpen className="w-4 h-4" />
            <span>OFFICIAL COMIC STRIP EDITION</span>
          </div>
          {onViewMyComics && (
            <button
              onClick={onViewMyComics}
              className="inline-flex items-center gap-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-bold text-xs px-3 py-1 rounded-full border-2 border-emerald-800 transition-colors cursor-pointer"
              title="Open My Comics library"
            >
              <span>✓ Saved in My Comics</span>
            </button>
          )}
        </div>

        <h1 className="font-comic text-4xl sm:text-5xl md:text-6xl text-slate-950 tracking-wide">
          {metadata.title || `${metadata.characterName}'s Adventure`}
        </h1>

        {metadata.originalPrompt && (
          <p className="text-sm sm:text-base italic text-slate-600 max-w-xl mx-auto mt-2 font-comic-body">
            "{metadata.originalPrompt}"
          </p>
        )}

        {/* Comic Attributes Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-4">
          <span className="bg-indigo-100 text-indigo-900 font-bold text-xs px-3 py-1.5 rounded-xl border border-indigo-300">
            Hero: {metadata.characterName}
          </span>
          <span className="bg-emerald-100 text-emerald-900 font-bold text-xs px-3 py-1.5 rounded-xl border border-emerald-300">
            Setting: {metadata.setting}
          </span>
          <span className="bg-amber-100 text-amber-900 font-bold text-xs px-3 py-1.5 rounded-xl border border-amber-300">
            Tone: {metadata.storyTone}
          </span>
          <span className="bg-rose-100 text-rose-900 font-bold text-xs px-3 py-1.5 rounded-xl border border-rose-300">
            Style: {metadata.artStyle}
          </span>
        </div>
      </div>

      {/* Vertical Panels List */}
      <div className="space-y-8 mb-12">
        {layout.map((panel) => {
          const formattedTitle = `Panel ${panel.panelNumber}: ${panel.title}`;

          return (
            <div
              key={panel.panelNumber}
              className="bg-white rounded-3xl comic-border-thick comic-shadow-lg p-5 sm:p-7 relative transition-transform hover:-translate-y-1"
            >
              {/* Panel Header Title */}
              <div className="flex items-center justify-between border-b-3 border-slate-900 pb-3 mb-4">
                <h3 className="font-comic text-2xl sm:text-3xl text-slate-950 flex items-center gap-2">
                  <span className="bg-yellow-300 text-slate-900 px-2.5 py-0.5 rounded-lg comic-border text-lg sm:text-xl">
                    #{panel.panelNumber}
                  </span>
                  <span>{formattedTitle}</span>
                </h3>

                <span className="text-xs font-bold text-slate-500 font-comic-body hidden sm:inline-block">
                  Panel {panel.panelNumber} of {layout.length}
                </span>
              </div>

              {/* Panel Content Grid (Responsive: 1 column on mobile, 2 columns on desktop) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Panel Illustration */}
                <div className="md:col-span-6 relative group">
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden comic-border bg-slate-100 comic-shadow-sm">
                    {panel.imageUrl ? (
                      <img
                        src={panel.imageUrl}
                        alt={formattedTitle}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-103"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                        <Sparkles className="w-10 h-10 mb-2 opacity-50" />
                        <span className="font-comic text-lg">Illustration Rendering</span>
                      </div>
                    )}

                    {/* Zoom Overlay Button */}
                    {panel.imageUrl && (
                      <button
                        onClick={() => setSelectedImage({ url: panel.imageUrl, title: formattedTitle })}
                        className="absolute bottom-3 right-3 bg-white/90 text-slate-900 p-2 rounded-xl comic-border comic-shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-yellow-300 cursor-pointer"
                        title="View Full Size"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Panel Text Blocks */}
                <div className="md:col-span-6 flex flex-col space-y-4">
                  {/* Scene Description (in italics) */}
                  {panel.sceneDescription && (
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Scene Description
                      </div>
                      <p className="text-sm italic text-slate-700 font-comic-body leading-relaxed">
                        {panel.sceneDescription}
                      </p>
                    </div>
                  )}

                  {/* Caption (brief ambient description or sound effects in yellow callout) */}
                  {panel.caption && (
                    <div className="bg-amber-100 rounded-xl p-3.5 border-2 border-amber-400 comic-shadow-sm">
                      <div className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-800 mb-1">
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Ambient Caption & SFX</span>
                      </div>
                      <p className="text-sm font-black text-amber-950 font-comic-body tracking-wide">
                        ⚡ {panel.caption}
                      </p>
                    </div>
                  )}

                  {/* Narration and Dialogue (character speech in quotes) */}
                  {panel.narration && (
                    <div className="bg-white rounded-2xl p-4 comic-border comic-shadow-sm relative">
                      <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-600 mb-1">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Narration & Character Dialogue</span>
                      </div>
                      <p className="text-base text-slate-900 font-comic-body font-bold leading-relaxed whitespace-pre-line">
                        {panel.narration}
                      </p>
                    </div>
                  )}

                  {/* Image prompt used in small grey text */}
                  {panel.imagePrompt && (
                    <div className="pt-2 text-[11px] text-slate-400 font-mono leading-tight">
                      <span className="font-semibold text-slate-500">Image prompt used: </span>
                      {panel.imagePrompt}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="sticky bottom-6 z-20 bg-white/95 backdrop-blur-md rounded-3xl comic-border-thick comic-shadow-lg p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-comic text-xl text-slate-900">Your Comic Strip is Ready!</h4>
          <p className="text-xs font-comic-body text-slate-600">
            Export as high-res multi-page PDF or tweak parameters to regenerate.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Regenerate Button */}
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isExporting}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-sm rounded-2xl comic-border comic-shadow-sm hover:translate-y-[-2px] active:translate-y-[1px] transition-all cursor-pointer disabled:opacity-50"
            title="Return to Home with pre-filled inputs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Regenerate with different tone/style</span>
          </button>

          {/* Download PDF Button */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-comic text-xl rounded-2xl comic-border comic-shadow hover:translate-y-[-2px] hover:comic-shadow-lg active:translate-y-[1px] transition-all cursor-pointer disabled:opacity-60"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Exporting PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Download Your Comic as PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
