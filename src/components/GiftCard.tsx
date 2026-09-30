import React, { useState, useRef, useEffect } from 'react';
import { Play, Video, Volume2, Sparkles, ArrowRight, ArrowLeft } from 'lucide-react';
import { GiftItem, Language } from '../types';
import { translations } from '../utils/translations';
import { SvgaPlayer } from './SvgaPlayer';
import { resolveMediaUrl, getMediaFromIndexedDb, getProxyMediaUrl } from '../utils/mediaStorage';

interface GiftCardProps {
  gift: GiftItem;
  lang: Language;
  onSelectGift: (gift: GiftItem) => void;
  onQuickBuy?: (gift: GiftItem) => void;
  onAddToCart?: (gift: GiftItem) => void;
  isSelected?: boolean;
}

export const GiftCard: React.FC<GiftCardProps> = ({
  gift,
  lang,
  onSelectGift,
  isSelected = false
}) => {
  const t = translations[lang];
  const [isHovered, setIsHovered] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const hasPoster = Boolean(gift.posterUrl && gift.posterUrl.trim());
  const isSvga = Boolean(
    gift.videoUrl && (
      gift.videoUrl.toLowerCase().endsWith('.svga') ||
      gift.videoUrl.toLowerCase().endsWith('.svga2') ||
      gift.videoUrl.includes('.svga?') ||
      gift.videoUrl.includes('data:application/octet-stream') ||
      gift.videoUrl.includes('gifts/svga')
    ) && !gift.videoUrl.toLowerCase().includes('.mp4') && !gift.videoUrl.toLowerCase().includes('.webm')
  );

  const isVideo = Boolean(
    gift.videoUrl && (
      gift.videoUrl.toLowerCase().includes('.mp4') ||
      gift.videoUrl.toLowerCase().includes('.webm') ||
      gift.videoUrl.includes('video/')
    )
  );

  const hasAudio = Boolean(
    gift.formats?.some(f => f.name.includes('声音') || f.name.includes('Sound') || f.name.includes('صوت')) ||
    gift.videoUrl ||
    gift.tags?.some(tag => tag.includes('صوت') || tag.includes('音效') || tag.includes('Audio')) ||
    true // Most live streaming gifts have sound effects
  );

  useEffect(() => {
    if (gift.videoUrl) {
      setVideoSrc(resolveMediaUrl(gift.videoUrl));
    }
  }, [gift.videoUrl]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current && hasPoster) {
      videoRef.current.pause();
    }
  };

  const handleVideoError = async () => {
    try {
      const cached = await getMediaFromIndexedDb(gift.id) || await getMediaFromIndexedDb(gift.videoUrl);
      if (cached) {
        setVideoSrc(URL.createObjectURL(cached));
        return;
      }
      if (gift.videoUrl && (gift.videoUrl.startsWith('http://') || gift.videoUrl.startsWith('https://')) && !videoSrc.includes('/api/proxy-media')) {
        setVideoSrc(getProxyMediaUrl(gift.videoUrl));
      }
    } catch (e) {}
  };

  const displayTitle = lang === 'ar' && gift.titleAr ? gift.titleAr : lang === 'en' && gift.titleEn ? gift.titleEn : gift.title;
  const authorName = gift.author?.name || (lang === 'ar' ? 'استوديو الإبداع' : '幻星空间');
  const authorAvatar = gift.author?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&auto=format&fit=crop&q=80';
  const durationSec = gift.duration || 7;
  const serialNo = gift.id.startsWith('NO.') ? gift.id : `NO.${gift.id.replace(/\D/g, '') || '273806'}`;

  // Tag translations
  const overseasTag = lang === 'ar' ? 'حصري' : lang === 'en' ? 'Global' : '海外';
  const categoryTag = gift.category === 'frames' 
    ? (lang === 'ar' ? 'إطار' : lang === 'en' ? 'Frame' : '头像框')
    : gift.category === 'luxury'
    ? (lang === 'ar' ? 'فاخر' : lang === 'en' ? 'Luxury' : '豪华')
    : (lang === 'ar' ? 'هدية' : lang === 'en' ? 'Gift' : '座驾');
  const effectTag = gift.effectType || (isSvga ? 'SVGA' : '2D');

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseEnter}
      onTouchEnd={handleMouseLeave}
      onClick={() => onSelectGift(gift)}
      className={`group relative flex flex-col rounded-2xl bg-[#0c1017] border transition-all duration-300 overflow-hidden cursor-pointer shadow-lg hover:shadow-cyan-950/40 ${
        isSelected 
          ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-amber-400/20 shadow-xl' 
          : 'border-slate-800/90 hover:border-cyan-500/70'
      }`}
    >
      {/* 1. Preview Container with Badges */}
      <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-b from-[#0a0d14] to-[#06080d] flex items-center justify-center p-3">
        {/* Top-Left: Red NEW ribbon badge (exact match to D.png) */}
        <div className="absolute top-0 left-0 z-20">
          <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-[9px] px-2 py-0.5 rounded-br-lg shadow-md tracking-wider flex items-center gap-0.5">
            <span>NEW</span>
          </div>
        </div>

        {/* Top-Right: Sound Effect badge (音效 / صوت) */}
        {hasAudio && (
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 text-cyan-300 text-[10px] font-semibold shadow-sm">
            <Volume2 className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>{lang === 'ar' ? 'صوت' : lang === 'en' ? 'Sound' : '音效'}</span>
          </div>
        )}

        {/* Media Preview:
            - At rest: Show posterUrl (clean customized cover image)
            - On Hover/Touch: If videoUrl exists, play video/animation immediately on hover!
        */}
        {hasPoster ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Background Playable Video / SVGA on Hover */}
            {(isVideo || isSvga || gift.videoUrl) && (
              <div className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${isHovered ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none'}`}>
                {isSvga ? (
                  <SvgaPlayer
                    src={videoSrc || gift.videoUrl}
                    autoPlay={isHovered}
                    loop={true}
                    isMuted={true}
                    backdrop="dark"
                    className="w-full h-full object-contain pointer-events-none drop-shadow-2xl"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    src={videoSrc || resolveMediaUrl(gift.videoUrl)}
                    autoPlay={isHovered}
                    loop
                    muted
                    playsInline
                    crossOrigin="anonymous"
                    onError={handleVideoError}
                    className="w-full h-full object-contain pointer-events-none drop-shadow-2xl"
                  />
                )}
              </div>
            )}

            {/* Front Poster Image (Visible when not hovered) */}
            <img
              src={resolveMediaUrl(gift.posterUrl)}
              alt={displayTitle}
              className={`w-full h-full object-contain pointer-events-none transition-all duration-300 drop-shadow-2xl ${
                isHovered && (isVideo || isSvga || gift.videoUrl) ? 'opacity-0 scale-105' : 'opacity-100 group-hover:scale-105'
              }`}
              loading="lazy"
              onError={(e) => {
                const target = e.currentTarget;
                const raw = gift.posterUrl || '';
                if (raw.startsWith('http') && !target.src.includes('/api/proxy-media')) {
                  target.src = `/api/proxy-media?url=${encodeURIComponent(raw)}`;
                }
              }}
            />
          </div>
        ) : isSvga && gift.videoUrl ? (
          <div className="w-full h-full flex items-center justify-center">
            <SvgaPlayer
              src={videoSrc || gift.videoUrl}
              autoPlay={true}
              loop={true}
              isMuted={true}
              backdrop="dark"
              className="w-full h-full object-contain pointer-events-none drop-shadow-2xl"
            />
          </div>
        ) : (isVideo || gift.videoUrl) && videoSrc && !gift.videoUrl?.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)(\?.*)?$/i) ? (
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            crossOrigin="anonymous"
            onError={handleVideoError}
            className="w-full h-full object-contain pointer-events-none drop-shadow-2xl"
          />
        ) : gift.videoUrl ? (
          <img
            src={resolveMediaUrl(gift.videoUrl)}
            alt={displayTitle}
            className="w-full h-full object-contain pointer-events-none transition-transform duration-500 group-hover:scale-105 opacity-100 filter-none drop-shadow-2xl"
            loading="lazy"
            onError={(e) => {
              const target = e.currentTarget;
              const originalSrc = gift.videoUrl || '';
              if (originalSrc.startsWith('http') && !target.src.includes('/api/proxy-media')) {
                target.src = `/api/proxy-media?url=${encodeURIComponent(originalSrc)}`;
              }
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
            <Video className="w-8 h-8 opacity-40 mb-1" />
            <span className="text-[10px] font-mono">{effectTag}</span>
          </div>
        )}
      </div>

      {/* 2. Content Info Section (Matching Reference D.png) */}
      <div className="p-3 pt-2.5 flex flex-col gap-1.5 bg-[#0c1017]">
        {/* Title & Price Row */}
        <div className="flex items-start justify-between gap-1.5">
          <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 leading-snug">
            {displayTitle}
          </h3>
          <span className="text-emerald-400 font-extrabold text-xs sm:text-sm whitespace-nowrap shrink-0">
            ¥ {gift.price} <span className="text-[10px] text-emerald-300/80 font-semibold">CNY</span>
          </span>
        </div>

        {/* Tags Row: [海外/حصري] [座驾/هدية] [2D/3D] */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-pink-950/70 text-pink-300 border border-pink-500/30 shadow-xs">
            {overseasTag}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800/90 text-slate-300 border border-slate-700/60">
            {categoryTag}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-300 bg-slate-800/90 border border-slate-700/60">
            {effectTag}
          </span>
        </div>

        {/* Serial Number & Duration Line: NO.273806 | *** | 时长: 7S */}
        <div className="flex items-center text-[10px] text-slate-500 font-mono tracking-tight pt-0.5">
          <span className="text-slate-400 font-medium">{serialNo}</span>
          <span className="mx-1 text-slate-600">|</span>
          <span className="text-slate-600">***</span>
          <span className="mx-1 text-slate-600">|</span>
          <span className="text-slate-400">{lang === 'ar' ? `المدة: ${durationSec}ث` : lang === 'en' ? `Duration: ${durationSec}s` : `时长:${durationSec}S`}</span>
        </div>

        {/* Studio / Creator Footer Line: Avatar + Studio Name */}
        <div className="flex items-center gap-1.5 pt-1.5 mt-0.5 border-t border-slate-800/60 text-[11px] text-slate-400 group-hover:text-slate-200 transition-colors">
          <img
            src={authorAvatar}
            alt={authorName}
            className="w-4 h-4 rounded-full object-cover border border-slate-700 shrink-0"
            loading="lazy"
          />
          <span className="truncate font-medium text-[11px] text-slate-300 group-hover:text-white">
            {authorName}
          </span>
        </div>
      </div>
    </div>
  );
};

