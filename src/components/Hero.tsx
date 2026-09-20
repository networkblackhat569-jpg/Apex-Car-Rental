import React from 'react';
import { Shield, Sparkles, CheckCircle2, Search, Sliders } from 'lucide-react';
import { HomepageSettings } from '../types';

interface HeroProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  homepageSettings?: HomepageSettings | null;
}

export const Hero: React.FC<HeroProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  homepageSettings,
}) => {
  const badgeText = homepageSettings?.hero_badge || 'Strict Vehicle Image Matching Enforced';
  const titleText = homepageSettings?.hero_title || 'Strictly Matched. Impeccably Maintained.';
  const subtitleText = homepageSettings?.hero_subtitle || 'The exact vehicle you select on your screen is the exact vehicle delivered to your doorstep. Every listing features dedicated, model-verified photography, transparent daily rates in PKR, and real client photo priority.';
  return (
    <section className="relative overflow-hidden border-b border-neutral-800/80 bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 pt-10 pb-12 sm:pt-16 sm:pb-16">
      {/* Subtle background ambient mesh */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[250px] bg-blue-500/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Trust badge */}
          <div className="inline-flex items-center space-x-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-medium text-amber-300 backdrop-blur-md mb-6 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <Shield className="h-3.5 w-3.5 text-amber-400" />
            <span>{badgeText}</span>
            <span className="h-1 w-1 rounded-full bg-amber-400" />
            <span className="text-amber-200/80">Exact Model Match</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white font-serif">
            {titleText.includes('.') ? (
              <>
                {titleText.split('.')[0]}. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 font-sans">
                  {titleText.split('.').slice(1).join('.').trim()}
                </span>
              </>
            ) : (
              titleText
            )}
          </h1>

          <p className="mt-4 text-sm sm:text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            {subtitleText}
          </p>

          {/* Key value pillars */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-neutral-300">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Dedicated Model Photos</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Client Fleet Photo Priority</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Instant WhatsApp Booking</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Zero Bait & Switch</span>
            </span>
          </div>
        </div>

        {/* Filter controls & Search */}
        <div className="mt-10 mx-auto max-w-4xl rounded-2xl border border-neutral-800 bg-neutral-900/80 p-3 sm:p-4 backdrop-blur-md shadow-2xl">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-80 flex-shrink-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                id="fleet-search-input"
                type="text"
                placeholder="Search Corolla, Civic, Sportage, Fortuner..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-950/80 py-2.5 pl-10 pr-4 text-sm text-neutral-100 placeholder-neutral-500 focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
            </div>

            {/* Category tabs */}
            <div className="flex w-full items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    id={`category-tab-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => onCategoryChange(cat)}
                    className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs sm:text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-amber-500 text-neutral-950 font-semibold shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                        : 'bg-neutral-950/60 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
