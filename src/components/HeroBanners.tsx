import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles, 
  Crown, 
  Bot, 
  Palette, 
  Package, 
  Globe2,
  Award,
  ExternalLink,
  Layers
} from 'lucide-react';
import { Language, HeroBannerItem, CustomCategory } from '../types';
import { translations } from '../utils/translations';
import { INITIAL_BANNERS } from '../data/initialBanners';

interface HeroBannersProps {
  lang: Language;
  banners?: HeroBannerItem[];
  categories?: CustomCategory[];
  selectedCategory?: string;
  onSelectQuickCategory: (catKey: string) => void;
  onOpenCustomDesignModal: () => void;
}

export const HeroBanners: React.FC<HeroBannersProps> = ({
  lang,
  banners,
  categories = [],
  selectedCategory = 'all',
  onSelectQuickCategory,
  onOpenCustomDesignModal
}) => {
  const t = translations[lang];
  const [currentSlide, setCurrentSlide] = useState(0);

  // Active banners list from props or fallback to initial banners
  const activeBanners = (banners && banners.length > 0)
    ? banners.filter(b => b.isActive !== false)
    : INITIAL_BANNERS;

  const slides = activeBanners.map((b, idx) => {
    return {
      id: b.id || idx + 1,
      badge: b.badge?.trim(),
      title: b.title?.trim(),
      subtitle: b.subtitle?.trim(),
      imageUrl: b.imageUrl?.trim(),
      bgGradient: b.bgGradient || (idx % 3 === 0 
        ? 'from-slate-950 via-indigo-950/90 to-blue-950/90' 
        : idx % 3 === 1 
        ? 'from-slate-950 via-blue-950/90 to-cyan-950/90' 
        : 'from-slate-950 via-purple-950/90 to-indigo-950/90'),
      btnText: b.btnText?.trim(),
      btnLink: b.btnLink?.trim(),
      dimensionsNote: b.dimensionsNote || '1920 × 600 px (16:5)',
      action: () => {
        if (b.btnLink) {
          const link = b.btnLink.trim();
          if (link === 'custom_design') {
            onOpenCustomDesignModal();
          } else if (link === 'vip') {
            onSelectQuickCategory('vip');
          } else if (link.startsWith('http://') || link.startsWith('https://') || link.startsWith('//') || link.startsWith('wa.me')) {
            const url = link.startsWith('wa.me') ? `https://${link}` : link;
            window.open(url, '_blank', 'noopener,noreferrer');
          } else {
            onSelectQuickCategory(link);
          }
        } else {
          onOpenCustomDesignModal();
        }
      }
    };
  });

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const current = slides[currentSlide] || slides[0];

  if (!current) return null;

  const hasAnyText = Boolean(current.badge || current.title || current.subtitle || current.btnText);

  // Gradient palettes for category badges
  const categoryColors = [
    'from-cyan-500/20 to-blue-600/20 text-cyan-300 border-cyan-500/40',
    'from-purple-500/20 to-pink-600/20 text-purple-300 border-purple-500/40',
    'from-emerald-500/20 to-teal-600/20 text-emerald-300 border-emerald-500/40',
    'from-rose-500/20 to-red-600/20 text-rose-300 border-rose-500/40',
    'from-indigo-500/20 to-blue-600/20 text-indigo-300 border-indigo-500/40',
    'from-amber-500/20 to-orange-600/20 text-amber-300 border-amber-500/40'
  ];

  return (
    <div className="mb-6 space-y-4">
      {/* Banner Carousel */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl group">
        <div 
          className={`relative min-h-[190px] sm:min-h-[220px] md:min-h-[260px] p-6 sm:p-8 flex flex-col justify-center bg-gradient-to-r ${current.bgGradient} transition-all duration-700 overflow-hidden cursor-pointer`}
          onClick={current.action}
          title={current.btnLink ? (lang === 'ar' ? 'اضغط لفتح الرابط المرفق مع البنر' : '点击打开链接') : undefined}
        >
          {/* Custom Banner Image Background: Full vibrancy and clarity for uploaded banners */}
          {current.imageUrl && (
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700 opacity-100 group-hover:scale-[1.01]"
              style={{ backgroundImage: `url(${current.imageUrl})` }}
            >
              {/* If banner has text, provide a subtle gradient scrim to ensure text readability */}
              {hasAnyText && (
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-slate-950/20" />
              )}
            </div>
          )}

          {/* Click Indicator Badge if Banner has a Link */}
          {current.btnLink && (
            <div className="absolute top-3.5 right-3.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-cyan-500/40 text-[11px] font-semibold text-cyan-300 shadow-lg backdrop-blur">
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>{lang === 'ar' ? 'رابط البنر' : '横幅链接'}</span>
            </div>
          )}

          {/* Background Decorative Glow (Only when there is text or gradient banner) */}
          {(!current.imageUrl || hasAnyText) && (
            <>
              <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-20 pointer-events-none overflow-hidden flex items-center justify-center z-0">
                <div className="w-96 h-96 rounded-full bg-cyan-500/30 blur-3xl"></div>
              </div>
              <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-4 opacity-35 pointer-events-none z-0">
                <div className="w-28 h-28 rounded-2xl border-2 border-cyan-400/30 rotate-12 flex items-center justify-center bg-cyan-500/10 backdrop-blur-sm">
                  <Award className="w-14 h-14 text-cyan-400" />
                </div>
                <div className="w-24 h-24 rounded-2xl border-2 border-blue-400/30 -rotate-6 flex items-center justify-center bg-blue-500/10 backdrop-blur-sm">
                  <ShieldCheck className="w-12 h-12 text-blue-400" />
                </div>
              </div>
            </>
          )}

          {/* Optional Text Overlay: Only rendered if at least one text field is non-empty! */}
          {hasAnyText && (
            <div className="relative z-10 max-w-2xl">
              {/* Badge Tag */}
              {current.badge && (
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-[11px] font-semibold text-cyan-300 shadow-sm backdrop-blur">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{current.badge}</span>
                  </div>
                </div>
              )}

              {current.title && (
                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-snug mb-2 drop-shadow-md">
                  {current.title}
                </h2>
              )}

              {current.subtitle && (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4 max-w-xl">
                  {current.subtitle}
                </p>
              )}

              {current.btnText && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    current.action();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all active:scale-95 cursor-pointer"
                >
                  <span>{current.btnText}</span>
                  {current.btnLink && <ExternalLink className="w-3 h-3 text-white/80" />}
                </button>
              )}
            </div>
          )}

          {/* Navigation Arrows */}
          {slides.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-white flex items-center justify-center backdrop-blur transition-colors z-20 cursor-pointer hover:bg-slate-800"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlide((prev) => (prev + 1) % slides.length);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-900/80 border border-slate-700/80 text-slate-300 hover:text-white flex items-center justify-center backdrop-blur transition-colors z-20 cursor-pointer hover:bg-slate-800"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Dots Indicator */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 pointer-events-auto">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentSlide(i);
                    }}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      i === currentSlide ? 'w-6 bg-cyan-400' : 'w-2 bg-slate-600 hover:bg-slate-400'
                    }`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dynamic Categories & Quick Feature Badges Row - Smooth horizontal scroll on mobile, flex-wrap on desktop */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none sm:flex-wrap">
        {/* VIP Section Button */}
        <button
          onClick={() => onSelectQuickCategory('vip')}
          className="shrink-0 flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-600/20 text-amber-300 border border-amber-500/40 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-95 text-xs font-semibold cursor-pointer whitespace-nowrap"
        >
          <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          <span>{lang === 'ar' ? 'منطقة VIP' : 'VIP 专区'}</span>
        </button>

        {/* Dynamic Categories (All Categories / القسم العام and user custom categories) */}
        {categories.map((cat, idx) => {
          const isSelected = selectedCategory === cat.id || (cat.id === 'general' && selectedCategory === 'all');
          const colorClass = categoryColors[idx % categoryColors.length];
          return (
            <button
              key={cat.id}
              onClick={() => onSelectQuickCategory(cat.id === 'general' ? 'all' : cat.id)}
              className={`shrink-0 flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl border transition-all duration-200 hover:scale-[1.02] text-xs font-semibold cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/20'
                  : `bg-gradient-to-r ${colorClass} hover:border-slate-500`
              }`}
            >
              {cat.id === 'general' ? (
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ) : (
                <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
              <span>{cat.name}</span>
            </button>
          );
        })}

        {/* Request Custom Design Button */}
        <button
          onClick={onOpenCustomDesignModal}
          className="shrink-0 flex items-center gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 text-blue-300 border border-blue-500/40 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg active:scale-95 text-xs font-semibold cursor-pointer whitespace-nowrap sm:mr-auto"
        >
          <Palette className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>{lang === 'ar' ? 'طلب تصميم خاص' : '定制动效'}</span>
        </button>
      </div>
    </div>
  );
};

