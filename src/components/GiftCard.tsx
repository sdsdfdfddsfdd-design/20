import React, { useState, useRef, useEffect } from 'react';
import { Play, Video, ArrowRight, ArrowLeft } from 'lucide-react';
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
  const formatName = gift.formats?.[0]?.name ? gift.formats[0].name.split(' ')[0].split('带')[0] : (isSvga ? 'SVGA' : isVideo ? 'MP4' : 'VFX');

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelectGift(gift)}
      className={`group relative flex flex-col rounded-2xl bg-[#0e121a] border transition-all duration-300 overflow-hidden cursor-pointer shadow-md ${
        isSelected 
          ? 'border-amber-400 ring-2 ring-amber-400/30 shadow-amber-400/20 shadow-lg' 
          : 'border-slate-800/80 hover:border-cyan-500/60 hover:shadow-cyan-950/20'
      }`}
    >
      {/* 1. Preview Container (Aspect Square / Frame Viewer with Clean Solid Dark BG) */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#07090e] flex items-center justify-center p-2">
        {/* SVGA Live Player */}
        {isSvga && gift.videoUrl ? (
          <div className="w-full h-full flex items-center justify-center">
            <SvgaPlayer
              src={videoSrc || gift.videoUrl}
              autoPlay={true}
              loop={true}
              isMuted={true}
              backdrop="dark"
              className="w-full h-full object-contain pointer-events-none"
            />
          </div>
        ) : isVideo && videoSrc ? (
          /* Video MP4 / WebM Player */
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            onError={handleVideoError}
            className="w-full h-full object-contain pointer-events-none"
          />
        ) : (gift.posterUrl || gift.videoUrl) ? (
          /* Image / Poster Frame (Natural Colors, Full Opacity) */
          <img
            src={resolveMediaUrl(gift.posterUrl || gift.videoUrl)}
            alt={displayTitle}
            className="w-full h-full object-contain pointer-events-none transition-transform duration-300 group-hover:scale-105 opacity-100 filter-none"
            loading="lazy"
          />
        ) : (
          /* Fallback visual */
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
            <Video className="w-8 h-8 opacity-40 mb-1" />
            <span className="text-[10px] font-mono">{formatName}</span>
          </div>
        )}
      </div>

      {/* 2. Content Info Section (Exact match to reference video) */}
      <div className="p-3 flex flex-col gap-1.5 bg-[#0e121a]">
        {/* Watch Animation Link */}
        <div className="flex items-center gap-1 text-cyan-400 group-hover:text-cyan-300 font-semibold text-xs transition-colors">
          <span>{t.watchAnimation}</span>
          {lang === 'ar' ? (
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          ) : (
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          )}
        </div>

        {/* Title and Price Row */}
        <div className="flex items-start justify-between gap-1.5 pt-0.5">
          <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-200 transition-colors line-clamp-1 leading-snug">
            {displayTitle}
          </h3>
          <span className="text-emerald-400 font-extrabold text-xs sm:text-sm whitespace-nowrap shrink-0">
            $ {gift.price} <span className="text-[10px] text-emerald-300/80 font-semibold">USD</span>
          </span>
        </div>

        {/* Format Badge (e.g. SVGA / MP4 / VAP) */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-0.5">
          <span className="text-slate-400 tracking-wider font-semibold">
            {formatName}
          </span>
          {gift.category && (
            <span className="text-[10px] text-slate-500 truncate max-w-[80px]">
              {gift.category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
