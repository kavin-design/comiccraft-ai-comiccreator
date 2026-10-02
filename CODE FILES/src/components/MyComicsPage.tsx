import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Download,
  Trash2,
  Search,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
  PlusCircle,
  AlertTriangle,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import type { ComicPanelLayout, ComicMetadata } from '../services/types';
import {
  SavedComic,
  getSavedComics,
  deleteComic,
  createSampleComic,
  STORAGE_CHANGE_EVENT,
} from '../services/comicStorage';
import { savePdf } from '../services/exporters';

interface MyComicsPageProps {
  onOpenComic: (comic: SavedComic) => void;
  onCreateNew: () => void;
  onExportSuccess: (filename: string, metadata: ComicMetadata, layout: ComicPanelLayout[]) => void;
}

export const MyComicsPage: React.FC<MyComicsPageProps> = ({
  onOpenComic,
  onCreateNew,
  onExportSuccess,
}) => {
  const [comics, setComics] = useState<SavedComic[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSetting, setSelectedSetting] = useState<string>('All');
  const [selectedStyle, setSelectedStyle] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');

  // Deletion modal state
  const [comicToDelete, setComicToDelete] = useState<SavedComic | null>(null);

  // PDF Export loading state per comic ID
  const [exportingId, setExportingId] = useState<string | null>(null);

  // Load comics from storage
  const loadComics = () => {
    const list = getSavedComics();
    setComics(list);
  };

  useEffect(() => {
    loadComics();

    // Listen to storage update events
    const handleStorageEvent = () => loadComics();
    window.addEventListener(STORAGE_CHANGE_EVENT, handleStorageEvent);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener(STORAGE_CHANGE_EVENT, handleStorageEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Filter & Sort
  const filteredComics = useMemo(() => {
    return comics
      .filter((comic) => {
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
          !query ||
          comic.title.toLowerCase().includes(query) ||
          comic.characterName.toLowerCase().includes(query) ||
          comic.originalPrompt.toLowerCase().includes(query) ||
          comic.setting.toLowerCase().includes(query);

        const matchesSetting =
          selectedSetting === 'All' ||
          comic.setting.toLowerCase() === selectedSetting.toLowerCase();

        const matchesStyle =
          selectedStyle === 'All' ||
          comic.artStyle.toLowerCase() === selectedStyle.toLowerCase();

        return matchesQuery && matchesSetting && matchesStyle;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
        }
        return a.title.localeCompare(b.title);
      });
  }, [comics, searchQuery, selectedSetting, selectedStyle, sortBy]);

  // Handle Delete
  const confirmDelete = () => {
    if (!comicToDelete) return;
    deleteComic(comicToDelete.id);
    setComicToDelete(null);
    loadComics();
  };

  // Direct PDF Export from Library
  const handleDirectExport = async (comic: SavedComic) => {
    if (exportingId) return;
    setExportingId(comic.id);
    try {
      const filename = await savePdf(comic.layout, comic.metadata);
      onExportSuccess(filename, comic.metadata, comic.layout);
    } catch (err: any) {
      console.error('Library PDF export failed:', err);
      alert(`Could not export PDF: ${err.message || 'Unknown error'}`);
    } finally {
      setExportingId(null);
    }
  };

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 max-w-6xl mx-auto">
      {/* Top Banner / Collection Header */}
      <div className="bg-yellow-400 rounded-2xl p-6 md:p-8 comic-border comic-shadow mb-8 relative overflow-hidden">
        {/* Background decorative comic bursts */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-amber-300 rounded-full comic-border opacity-40 pointer-events-none transform rotate-12" />
        <div className="absolute -left-10 -top-10 w-36 h-36 bg-rose-400 rounded-full comic-border opacity-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-slate-900 text-yellow-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 comic-shadow-sm">
              <Layers className="w-3.5 h-3.5" />
              <span>Local Storage Library</span>
            </div>
            <h1 className="font-comic text-3xl md:text-5xl text-slate-950 tracking-wider">
              MY COMIC COLLECTION
            </h1>
            <p className="text-slate-800 text-sm md:text-base font-semibold max-w-xl mt-1">
              Browse, re-read, and export all your generated 5-panel comic adventures. Saved locally in your browser.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onCreateNew}
              className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-comic text-lg px-5 py-3 rounded-xl comic-border comic-shadow transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Create New Comic</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 md:p-5 comic-border comic-shadow-sm mb-8 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Bar */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, character, prompt..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Setting Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedSetting}
              onChange={(e) => setSelectedSetting(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              <option value="All">All Settings</option>
              <option value="Forest">Forest</option>
              <option value="Space">Space</option>
              <option value="City">City</option>
              <option value="School">School</option>
            </select>
          </div>

          {/* Art Style Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              <option value="All">All Styles</option>
              <option value="Comic Book">Comic Book</option>
              <option value="Anime">Anime</option>
              <option value="Pixel Art">Pixel Art</option>
              <option value="Realistic">Realistic</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Counter & Active Filter Pills */}
        <div className="flex flex-wrap items-center justify-between text-xs font-bold text-slate-600 pt-1 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-900 font-extrabold">{filteredComics.length}</strong> of{' '}
            {comics.length} saved comics
          </span>
          {(selectedSetting !== 'All' || selectedStyle !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedSetting('All');
                setSelectedStyle('All');
                setSearchQuery('');
              }}
              className="text-amber-600 hover:text-amber-800 underline font-semibold cursor-pointer"
            >
              Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Comic Grid */}
      {filteredComics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredComics.map((comic) => (
            <div
              key={comic.id}
              className="bg-white rounded-2xl comic-border comic-shadow flex flex-col overflow-hidden group hover:-translate-y-1 transition-all duration-200"
            >
              {/* Cover / Panel 1 Thumbnail */}
              <div className="relative aspect-4/3 w-full bg-slate-950 overflow-hidden border-b-3 border-slate-900">
                {comic.thumbnailUrl ? (
                  <img
                    src={comic.thumbnailUrl}
                    alt={comic.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-100">
                    <BookOpen className="w-10 h-10 mb-2 opacity-40" />
                    <span className="font-comic text-sm">Comic Cover</span>
                  </div>
                )}

                {/* Top Overlay Badges */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="bg-yellow-400 text-slate-900 text-xs font-black uppercase px-2 py-0.5 rounded-md comic-border comic-shadow-sm">
                    {comic.artStyle}
                  </span>
                  <span className="bg-slate-900 text-white text-xs font-bold uppercase px-2 py-0.5 rounded-md comic-shadow-sm">
                    {comic.setting}
                  </span>
                </div>

                <div className="absolute top-2.5 right-2.5">
                  <span className="bg-rose-500 text-white text-xs font-black uppercase px-2 py-0.5 rounded-md comic-border comic-shadow-sm">
                    5 Panels
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  {/* Date & Tone */}
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold mb-1.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(comic.savedAt || comic.createdAt)}
                    </span>
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                      {comic.storyTone}
                    </span>
                  </div>

                  {/* Comic Title */}
                  <h3 className="font-comic text-xl text-slate-950 tracking-wide line-clamp-1 mb-1">
                    {comic.title}
                  </h3>

                  {/* Character Name */}
                  <p className="text-xs font-extrabold text-amber-600 mb-3 flex items-center gap-1">
                    <span>★ Starring:</span>
                    <span className="text-slate-800">{comic.characterName}</span>
                  </p>

                  {/* 5-Panel Mini Preview Strip */}
                  <div className="mb-4">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                      Story Arc Panels:
                    </span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {comic.layout.slice(0, 5).map((panel, idx) => (
                        <div
                          key={idx}
                          title={`Panel ${idx + 1}: ${panel.title}`}
                          className="relative aspect-square rounded-md overflow-hidden border-2 border-slate-900 bg-slate-100"
                        >
                          {panel.imageUrl ? (
                            <img
                              src={panel.imageUrl}
                              alt={panel.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-comic text-[10px] text-slate-400">
                              {idx + 1}
                            </div>
                          )}
                          <span className="absolute bottom-0 right-0 bg-slate-950 text-white text-[9px] font-black px-1 rounded-tl">
                            {idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t-2 border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onOpenComic(comic)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-yellow-400 hover:bg-yellow-500 text-slate-950 font-comic text-sm py-2 px-3 rounded-xl comic-border comic-shadow-sm transition-transform active:scale-95 cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Read Comic</span>
                  </button>

                  <button
                    onClick={() => handleDirectExport(comic)}
                    disabled={exportingId === comic.id}
                    title="Export multi-page PDF"
                    className="flex items-center justify-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs py-2 px-3 rounded-xl border-2 border-slate-900 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {exportingId === comic.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">PDF</span>
                  </button>

                  <button
                    onClick={() => setComicToDelete(comic)}
                    title="Delete comic"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl p-8 md:p-14 comic-border comic-shadow text-center max-w-xl mx-auto my-6">
          <div className="w-20 h-20 bg-amber-100 rounded-3xl comic-border comic-shadow-sm mx-auto flex items-center justify-center mb-5 transform -rotate-6">
            <BookOpen className="w-10 h-10 text-amber-600" strokeWidth={2.5} />
          </div>

          <h3 className="font-comic text-2xl md:text-3xl text-slate-950 tracking-wide mb-2">
            NO COMICS FOUND
          </h3>

          <p className="text-slate-600 text-sm md:text-base font-semibold max-w-md mx-auto mb-6">
            {searchQuery || selectedSetting !== 'All' || selectedStyle !== 'All'
              ? 'No saved creations match your current filters. Try resetting search or filter options.'
              : 'Your comic library is currently empty. Unleash your creativity and generate your first 5-panel story strip!'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {searchQuery || selectedSetting !== 'All' || selectedStyle !== 'All' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSetting('All');
                  setSelectedStyle('All');
                }}
                className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-comic text-base px-6 py-3 rounded-xl comic-border comic-shadow-sm transition-transform active:scale-95 cursor-pointer"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={onCreateNew}
                className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white font-comic text-base px-6 py-3 rounded-xl comic-border comic-shadow transition-transform active:scale-95 cursor-pointer"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Create Your First Comic</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {comicToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setComicToDelete(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full comic-border-thick comic-shadow-lg text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-rose-100 rounded-2xl comic-border mx-auto flex items-center justify-center mb-4 text-rose-600">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="font-comic text-2xl text-slate-950 mb-2">
              DELETE COMIC?
            </h3>

            <p className="text-sm font-semibold text-slate-600 mb-6">
              Are you sure you want to delete{' '}
              <strong className="text-slate-900">"{comicToDelete.title}"</strong>? This will permanently remove it from your browser's local library.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setComicToDelete(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl border-2 border-slate-900 transition-colors cursor-pointer"
              >
                Keep Comic
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-comic text-base py-2.5 px-4 rounded-xl comic-border comic-shadow-sm transition-transform active:scale-95 cursor-pointer"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
