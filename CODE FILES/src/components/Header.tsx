import React from 'react';
import { BookOpen, Sparkles, PlusCircle, Layers } from 'lucide-react';

interface HeaderProps {
  currentView: 'home' | 'preview' | 'success' | 'my-comics';
  onNavigate: (view: 'home' | 'my-comics') => void;
  savedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  savedCount,
}) => {
  const isCreateActive = currentView === 'home';
  const isMyComicsActive = currentView === 'my-comics';

  return (
    <header className="sticky top-0 z-30 bg-amber-300/95 backdrop-blur-md border-b-4 border-slate-900 px-4 py-2.5 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-left group transition-transform active:scale-95 cursor-pointer"
          title="ComicCraft Home"
        >
          <div className="w-10 h-10 bg-rose-500 rounded-xl comic-border comic-shadow-sm flex items-center justify-center transform -rotate-3 group-hover:rotate-0 transition-transform">
            <BookOpen className="w-5 h-5 text-yellow-300" strokeWidth={2.5} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-comic text-2xl md:text-3xl text-slate-950 tracking-wider">
                COMICCRAFT
              </span>
              <span className="hidden lg:inline-block bg-yellow-400 text-slate-900 font-sans-ui text-[10px] font-black uppercase px-2 py-0.5 rounded comic-border comic-shadow-sm">
                AI Strip Studio
              </span>
            </div>
          </div>
        </button>

        {/* Central Navigation Tabs */}
        <nav className="flex items-center gap-2 bg-amber-400/80 p-1 rounded-2xl comic-border">
          <button
            onClick={() => onNavigate('home')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-comic text-sm transition-all cursor-pointer ${
              isCreateActive
                ? 'bg-slate-950 text-yellow-300 comic-shadow-sm -translate-y-0.5'
                : 'bg-white/70 hover:bg-white text-slate-900 font-bold'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Comic</span>
          </button>

          <button
            onClick={() => onNavigate('my-comics')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-comic text-sm transition-all cursor-pointer ${
              isMyComicsActive
                ? 'bg-slate-950 text-yellow-300 comic-shadow-sm -translate-y-0.5'
                : 'bg-white/70 hover:bg-white text-slate-900 font-bold'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>My Comics</span>
            {savedCount > 0 && (
              <span
                className={`ml-1 text-[11px] font-black px-1.5 py-0.2 rounded-full ${
                  isMyComicsActive
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-900 text-yellow-300'
                }`}
              >
                {savedCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Status Badge */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white text-slate-900 px-3 py-1.5 rounded-full text-xs font-bold comic-border comic-shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="hidden md:inline">Free Tier Friendly</span>
            <span className="md:hidden">Free</span>
          </div>
        </div>
      </div>
    </header>
  );
};
