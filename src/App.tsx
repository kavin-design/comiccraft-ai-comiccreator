/**
 * ComicCraft – AI Comic Story Creator
 * Main React Application
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { ComicPreviewPage } from './components/ComicPreviewPage';
import { ExportSuccessPage } from './components/ExportSuccessPage';
import { MyComicsPage } from './components/MyComicsPage';
import { GenerationProgress, PipelineStep } from './components/GenerationProgress';
import type { ComicInput, ComicPanelLayout, ComicMetadata } from './services/types';
import { generateOutline } from './services/geminiFlash';
import { generateStory } from './services/geminiPro';
import { generateImage } from './services/imageGenerator';
import { buildComicLayout } from './services/layoutBuilder';
import {
  saveComic,
  getSavedComicsCount,
  STORAGE_CHANGE_EVENT,
  SavedComic,
} from './services/comicStorage';

type AppView = 'home' | 'preview' | 'success' | 'my-comics';

const DEFAULT_INPUT: ComicInput = {
  prompt: 'A brave fox exploring an enchanted forest discovers a magical glowing tree',
  characterName: 'Barnaby the Fox',
  setting: 'Forest',
  storyTone: 'Light-hearted',
  artStyle: 'Comic Book',
};

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [inputValues, setInputValues] = useState<ComicInput>(DEFAULT_INPUT);

  // Local storage comic count tracking
  const [savedCount, setSavedCount] = useState<number>(0);

  useEffect(() => {
    // Initialize count and listen for storage updates
    setSavedCount(getSavedComicsCount());

    const updateCount = () => {
      setSavedCount(getSavedComicsCount());
    };

    window.addEventListener(STORAGE_CHANGE_EVENT, updateCount);
    window.addEventListener('storage', updateCount);

    return () => {
      window.removeEventListener(STORAGE_CHANGE_EVENT, updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, []);

  // Generation pipeline state
  const [isGenerating, setIsGenerating] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>('idle');
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Completed comic state
  const [comicLayout, setComicLayout] = useState<ComicPanelLayout[]>([]);
  const [comicMetadata, setComicMetadata] = useState<ComicMetadata>({
    title: '',
    characterName: '',
    setting: '',
    storyTone: '',
    artStyle: '',
    originalPrompt: '',
  });

  // Success view state
  const [exportedFilename, setExportedFilename] = useState<string>('');

  /**
   * Runs the full generation pipeline in sequence:
   * generateOutline -> generateStory -> generateImage x 5 -> buildComicLayout -> show Preview
   */
  const runGenerationPipeline = async (input: ComicInput) => {
    setInputValues(input);
    setIsGenerating(true);
    setGenerationError(null);

    try {
      // Step 1: Writing outline...
      setPipelineStep('outline');
      const outlineData = await generateOutline(input);

      if (!outlineData || !outlineData.panels || outlineData.panels.length !== 5) {
        throw new Error('Outline generation failed: Did not receive 5 valid panels.');
      }

      // Step 2: Writing story...
      setPipelineStep('story');
      const storyPanels = await generateStory(outlineData.panels, input);

      // Step 3: Drawing panels 1/5 through 5/5 sequentially with short delay
      const images: string[] = [];
      const drawingSteps: PipelineStep[] = [
        'drawing-1',
        'drawing-2',
        'drawing-3',
        'drawing-4',
        'drawing-5',
      ];

      for (let i = 0; i < 5; i++) {
        setPipelineStep(drawingSteps[i]);
        const panelOutline = outlineData.panels[i];

        const imgUrl = await generateImage(
          panelOutline.imagePrompt,
          input.artStyle,
          panelOutline.panelNumber || i + 1,
          input.setting,
          input.characterName
        );
        images.push(imgUrl);

        // Short pause between image requests to respect rate limits
        if (i < 4) {
          await new Promise((res) => setTimeout(res, 500));
        }
      }

      // Step 4: Building layout...
      setPipelineStep('layout');
      const layout = buildComicLayout(outlineData.panels, storyPanels, images);

      const metadata: ComicMetadata = {
        title: outlineData.comicTitle || `${input.characterName}'s Adventure`,
        characterName: input.characterName,
        setting: input.setting,
        storyTone: input.storyTone,
        artStyle: input.artStyle,
        originalPrompt: input.prompt,
        createdAt: new Date().toISOString(),
      };

      // Automatically persist to Local Storage
      saveComic(metadata, layout);
      setSavedCount(getSavedComicsCount());

      setComicLayout(layout);
      setComicMetadata(metadata);
      setPipelineStep('done');

      // Navigate to Preview Page
      setIsGenerating(false);
      setCurrentView('preview');
    } catch (err: any) {
      console.error('Pipeline error:', err);
      setPipelineStep('error');
      setGenerationError(err.message || 'An unexpected error occurred while creating your comic.');
    }
  };

  /**
   * Retry failed generation with existing inputs
   */
  const handleRetry = () => {
    runGenerationPipeline(inputValues);
  };

  /**
   * "Regenerate with different tone/style" handler:
   * Returns to Home with previous inputs pre-filled
   */
  const handleRegenerate = () => {
    setCurrentView('home');
  };

  /**
   * Export Success handler:
   * Navigates to Screen 3 showing the downloaded filename
   */
  const handleExportSuccess = (filename: string) => {
    setExportedFilename(filename);
    setCurrentView('success');
  };

  /**
   * "Go Create Another Comic" handler:
   * Resets state and returns to Home
   */
  const handleResetToNew = () => {
    setInputValues({
      prompt: '',
      characterName: '',
      setting: 'Forest',
      storyTone: 'Light-hearted',
      artStyle: 'Comic Book',
    });
    setComicLayout([]);
    setExportedFilename('');
    setCurrentView('home');
  };

  /**
   * Opens a previously saved comic in the full reader / preview page
   */
  const handleOpenSavedComic = (comic: SavedComic) => {
    setComicLayout(comic.layout);
    setComicMetadata(comic.metadata);
    setCurrentView('preview');
  };

  /**
   * Navigation handler between tabs
   */
  const handleNavigate = (view: 'home' | 'my-comics') => {
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/40 text-slate-900 font-sans-ui selection:bg-amber-300 selection:text-slate-950">
      {/* App Header with Navigation Tabs */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        savedCount={savedCount}
      />

      {/* Main Content Area based on currentView */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomePage
            initialValues={inputValues}
            onSubmit={runGenerationPipeline}
          />
        )}

        {currentView === 'my-comics' && (
          <MyComicsPage
            onOpenComic={handleOpenSavedComic}
            onCreateNew={() => setCurrentView('home')}
            onExportSuccess={(filename, meta, lay) => {
              setComicMetadata(meta);
              setComicLayout(lay);
              setExportedFilename(filename);
              setCurrentView('success');
            }}
          />
        )}

        {currentView === 'preview' && (
          <ComicPreviewPage
            layout={comicLayout}
            metadata={comicMetadata}
            onRegenerate={handleRegenerate}
            onExportSuccess={handleExportSuccess}
            onViewMyComics={() => setCurrentView('my-comics')}
          />
        )}

        {currentView === 'success' && (
          <ExportSuccessPage
            filename={exportedFilename}
            metadata={comicMetadata}
            layout={comicLayout}
            onReset={handleResetToNew}
            onViewMyComics={() => setCurrentView('my-comics')}
          />
        )}
      </main>

      {/* Generation Progress Overlay */}
      {isGenerating && (
        <GenerationProgress
          currentStep={pipelineStep}
          error={generationError}
          onRetry={handleRetry}
          characterName={inputValues.characterName}
        />
      )}
    </div>
  );
}
