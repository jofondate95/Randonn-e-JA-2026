import React from 'react';
import { Calendar, MapPin, Compass, ShieldCheck, Share2 } from 'lucide-react';
import bancoForestTrail from '../assets/images/banco_forest_trail_1788502647662.jpg';

interface HeaderProps {
  onAdminClick?: () => void;
  onShareClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAdminClick, onShareClick }) => {
  return (
    <header className="relative overflow-hidden bg-[#3e3e2b] text-[#f5f2ed] pb-10 pt-8 sm:pt-12 border-b border-[#5A5A40]/40 shadow-sm">
      {/* Background Image: Banco Tropical Forest Trail - Eclaircie et bien visible */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <img
          src={bancoForestTrail}
          alt="Piste de randonnée dans la forêt du Banco"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-[center_60%] opacity-65 sm:opacity-75 filter saturate-120 brightness-105 contrast-105 transition-all duration-700"
        />
        {/* Voile lumineux et aéré pour révéler la piste tout en garantissant un contraste parfait */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#242416]/55 via-[#363622]/35 to-[#1f1f12]/65" />
      </div>

      {/* Artistic 2026 Watermark */}
      <div 
        className="absolute -top-12 sm:-top-16 -left-8 sm:-left-12 opacity-15 text-[180px] sm:text-[240px] font-bold select-none pointer-events-none font-sans leading-none text-[#f5f2ed] z-1"
        aria-hidden="true"
      >
        2026
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 z-10">
        {/* Accent Bar & Tagline */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 bg-[#D2691E] shadow-xs" />
            <span className="uppercase tracking-[0.3em] text-[11px] font-bold text-[#f5f2ed] drop-shadow-xs">
              Événement Annuel
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onShareClick && (
              <button
                type="button"
                onClick={onShareClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#f5f2ed]/20 hover:bg-[#f5f2ed]/30 text-white border border-[#f5f2ed]/35 backdrop-blur-xs shadow-xs transition-all cursor-pointer"
                title="Obtenir le lien simplifié et QR Code du formulaire"
              >
                <Share2 className="w-3.5 h-3.5 text-[#D2691E]" />
                <span className="font-bold">Lien simplifié</span>
              </button>
            )}

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#f5f2ed]/15 border border-[#f5f2ed]/25 text-[#f5f2ed] backdrop-blur-xs">
              <Compass className="w-3.5 h-3.5 text-[#D2691E]" />
              <span>Forêt du Banco</span>
            </span>
          </div>
        </div>

        {/* Hero Title in Serif Italic */}
        <div className="text-left space-y-2 mb-6">
          <h1 className="text-4xl sm:text-6xl font-serif italic leading-none text-[#f5f2ed] drop-shadow-md">
            Randonnée 2026
          </h1>

          <p className="text-base sm:text-lg opacity-95 font-medium max-w-xl leading-relaxed text-[#f5f2ed] drop-shadow-sm">
            Dimanche 15 Novembre 2026 • Exploration et ressourcement en pleine nature
          </p>
        </div>

        {/* Key Event Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 border-t border-[#f5f2ed]/25">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#2e2e1f]/60 backdrop-blur-xs border border-[#f5f2ed]/20 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-[#D2691E] flex items-center justify-center text-white shrink-0 shadow-xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[11px] text-[#f5f2ed]/80 uppercase tracking-wider font-semibold">Date & Heure</div>
              <div className="text-sm font-semibold text-[#f5f2ed]">15 Nov 2026 • 06h30</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#2e2e1f]/60 backdrop-blur-xs border border-[#f5f2ed]/20 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-[#f5f2ed]/25 flex items-center justify-center text-[#f5f2ed] shrink-0">
              <MapPin className="w-4 h-4 text-[#D2691E]" />
            </div>
            <div>
              <div className="text-[11px] text-[#f5f2ed]/80 uppercase tracking-wider font-semibold">Rassemblement</div>
              <div className="text-sm font-semibold text-[#f5f2ed]">Entrée Forêt du Banco</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#2e2e1f]/60 backdrop-blur-xs border border-[#f5f2ed]/20 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-[#f5f2ed]/25 flex items-center justify-center text-[#f5f2ed] shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <div className="text-[11px] text-[#f5f2ed]/80 uppercase tracking-wider font-semibold">Inscriptions</div>
              <div className="text-sm font-semibold text-[#f5f2ed]">Session officielle ouverte</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
