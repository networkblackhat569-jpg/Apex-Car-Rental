import React from 'react';
import { ShieldCheck, MessageSquare, Sparkles, SlidersHorizontal, Car } from 'lucide-react';

interface NavbarProps {
  onOpenVerifier: () => void;
  onOpenChat: () => void;
  onOpenAdmin: () => void;
  totalVehicles: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenVerifier,
  onOpenChat,
  onOpenAdmin,
  totalVehicles,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand identity */}
        <div className="flex items-center space-x-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 via-neutral-900 to-neutral-950 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
            <Car className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white font-serif uppercase">
                APEX <span className="text-amber-400 font-sans font-light">FLEET</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Strict Matching
              </span>
            </div>
            <p className="text-xs text-neutral-400 hidden sm:block">
              100% Model-Verified Luxury & Executive Rentals
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* AI Image Verifier Button */}
          <button
            id="nav-verify-photo-btn"
            onClick={onOpenVerifier}
            className="flex items-center space-x-2 rounded-lg border border-neutral-800 bg-neutral-900/90 px-3 py-2 text-xs sm:text-sm font-medium text-neutral-200 transition-all hover:border-amber-500/40 hover:bg-neutral-800 hover:text-white"
            title="Inspect & Verify Vehicle Photo with AI"
          >
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            <span className="hidden md:inline">Verify Photo</span>
          </button>

          {/* AI Concierge Chat Button */}
          <button
            id="nav-concierge-btn"
            onClick={onOpenChat}
            className="flex items-center space-x-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs sm:text-sm font-medium text-amber-300 transition-all hover:bg-amber-500/20 hover:border-amber-500/50"
          >
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Fleet Concierge</span>
          </button>

          {/* Admin / Fleet Manager Drawer Toggle */}
          <button
            id="nav-admin-btn"
            onClick={onOpenAdmin}
            className="flex items-center space-x-1.5 rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-xs sm:text-sm font-medium text-neutral-300 hover:text-white hover:border-neutral-700"
            title="Fleet Manager & Photo Priority Settings"
          >
            <SlidersHorizontal className="h-4 w-4 text-neutral-400" />
            <span className="hidden lg:inline">Fleet Editor</span>
            <span className="ml-1 rounded-full bg-neutral-800 px-1.5 py-0.2 text-[10px] text-neutral-400">
              {totalVehicles}
            </span>
          </button>

          {/* Direct WhatsApp Hotline */}
          <a
            id="nav-whatsapp-direct"
            href="https://wa.me/923001234567?text=Hello%20Apex%20Car%20Rental,%20I%20would%20like%20to%20inquire%20about%20vehicle%20availability."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition-colors"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
        </div>
      </div>
    </header>
  );
};
