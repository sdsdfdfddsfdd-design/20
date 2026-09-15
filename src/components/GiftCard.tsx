import React, { useState, useRef } from 'react';
import { Play, Eye, ShoppingCart, CheckCircle2, Sparkles, Flame, MessageCircle, Video } from 'lucide-react';
import { GiftItem, Language } from '../types';
import { translations } from '../utils/translations';

interface GiftCardProps {
  gift: GiftItem;
  lang: Language;
  onSelectGift: (gift: GiftItem) => void;
  onQuickBuy: (gift: GiftItem) => void;
  onAddToCart: (gift: GiftItem) => void;
}

export const GiftCard: React.FC<GiftCardProps> = ({
  gift,
  lang,
  onSelectGift,
  onQuickBuy,
  onAddToCart
}) => {
  const t = translations[lang];
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const hasPoster = Boolean(gift.posterUrl && gift.posterUrl.trim());

  const startTime = typeof gift.previewStartTime === 'number' ? gift.previewStartTime : 0;

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      if (startTime > 0 && Math.abs(videoRef.current.currentTime - startTime) > 0.5 && !isHovered) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play().catch(() => {
        // Autoplay may be restricted if user hasn't interacted
      });
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      if (startTime > 0) {
        videoRef.current.currentTime = startTime;
      }
    }
  };

  const displayTitle = lang === 'ar' && gift.titleAr ? gift.titleAr : lang === 'en' && gift.titleEn ? gift.titleEn : gift.title;

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onSelectGift(gift)}
      className="group relative flex flex-col rounded-2xl bg-[#131722] border border-slate-800/90 hover:border-cyan-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-950/20 overflow-hidden cursor-pointer"
    >
      {/* Visual Container (Video on hover or full video face when no poster) */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-slate-950 flex items-center justify-center">
        {/* Background Poster Image (Only if poster is provided and not disabled) */}
        {hasPoster && (
          <img
            src={gift.posterUrl}
            alt={displayTitle}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              isHovered ? 'opacity-20' : 'opacity-100'
            }`}
            loading="lazy"
          />
        )}

        {/* Live Video Stream Preview (Takes full stage when no poster image, or plays on hover) */}
        <video
          ref={videoRef}
          src={gift.videoUrl ? `${gift.videoUrl}#t=${startTime > 0 ? startTime : 0.001}` : undefined}
          onLoadedMetadata={(e) => {
            if (startTime > 0) {
              e.currentTarget.currentTime = startTime;
            }
          }}
          loop
          muted
          playsInline
          preload="metadata"
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            hasPoster
              ? isHovered ? 'absolute inset-0 opacity-100' : 'absolute inset-0 opacity-0 pointer-events-none'
              : 'opacity-100'
          }`}
        />

        {/* Video-Only Badge (if no poster image) */}
        {!hasPoster && (
          <div className="absolute bottom-2.5 right-2.5 z-10 pointer-events-none flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-950/80 backdrop-blur-md border border-cyan-500/40 text-[10px] text-cyan-300 font-medium">
            <Video className="w-2.5 h-2.5" />
            <span>{lang === 'ar' ? 'فيديو مباشر' : '动态视频'}</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-red-600 to-pink-600 text-white text-[10px] font-bold shadow-md uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-2.5 h-2.5 fill-current" />
              {gift.isNew ? (lang === 'ar' ? 'جديد' : '新秀') : (lang === 'ar' ? 'أصلي' : '原创')}
            </span>
            {gift.isVip && (
              <span className="px-1.5 py-0.5 rounded-md bg-amber-500/90 text-slate-950 text-[10px] font-black">
                VIP
              </span>
            )}
          </div>

          <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-cyan-300 text-[10px] font-mono font-semibold border border-slate-700/60">
            {gift.formats[0]?.name.split('带')[0] || 'SVGA'}
          </span>
        </div>

        {/* Overlay Hover Actions on Desktop */}
        <div
          className={`hidden sm:flex absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex-col justify-end p-3 transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectGift(gift);
              }}
              className="flex-1 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-semibold flex items-center justify-center gap-1 border border-slate-700 backdrop-blur"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>{lang === 'ar' ? 'معاينة' : '试看'}</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickBuy(gift);
              }}
              className="flex-1 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-emerald-500/20"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{t.buyNowBtn}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Card Info Section - 100% clone of video with mobile refinement */}
      <div className="p-2.5 sm:p-3.5 flex flex-col flex-1 justify-between gap-2 sm:gap-2.5">
        <div>
          {/* Title & Price Line */}
          <div className="flex items-center justify-between gap-1.5 mb-1 sm:mb-1.5">
            <h3 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
              {displayTitle}
            </h3>
            <span className="text-emerald-400 font-extrabold text-xs sm:text-sm whitespace-nowrap">
              $ {gift.price} <span className="text-[9px] sm:text-[10px] text-emerald-300/80 font-semibold">USD</span>
            </span>
          </div>

          {/* Tags line: [AI 原创] [主题] [礼物] [2D/3D] */}
          <div className="flex flex-wrap items-center gap-1 mb-1.5 sm:mb-2">
            <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.2 rounded bg-cyan-950/70 text-cyan-400 border border-cyan-800/50">
              AI 原创
            </span>
            <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.2 rounded bg-slate-800/90 text-slate-300 border border-slate-700/60">
              {gift.theme}
            </span>
            <span className="hidden xs:inline-block text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.2 rounded bg-slate-800/90 text-slate-300 border border-slate-700/60">
              礼物
            </span>
            <span className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.2 rounded bg-blue-950/70 text-blue-300 border border-blue-800/50 font-semibold">
              {gift.effectType}
            </span>
          </div>

          {/* Details line: NO. ID + 全网排他 */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-mono">
            <span className="truncate max-w-[90px]">{gift.id}</span>
            <span className="text-slate-400 shrink-0">
              {t.exclusiveLabel}: ${gift.exclusivePrice}
            </span>
          </div>
        </div>

        {/* Creator Info Footer with WhatsApp direct contact */}
        <div className="pt-1.5 sm:pt-2 border-t border-slate-800/70 flex items-center justify-between text-[10px] sm:text-[11px]">
          <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
            <img
              src={gift.author.avatar}
              alt={gift.author.name}
              className="w-4 h-4 rounded-full object-cover shrink-0"
            />
            <span className="text-slate-300 font-medium truncate max-w-[70px] sm:max-w-[95px] hover:text-cyan-300" title={gift.author.name}>
              {gift.author.name}
            </span>
            {gift.author.verified && (
              <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0 hidden sm:inline" />
            )}

            {/* Direct WhatsApp Chat Trigger */}
            {gift.author.whatsapp && (
              <a
                href={`https://wa.me/${gift.author.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                  lang === 'ar'
                    ? `مرحباً، أنا مهتم بالحصول على مؤثر البث [${displayTitle} - ${gift.id}] المعروض في المنصة.`
                    : `Hello! I am inquiring about the live stream gift effect [${displayTitle} - ${gift.id}].`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                title={lang === 'ar' ? `تواصل مع ${gift.author.name} عبر واتساب: ${gift.author.whatsapp}` : `Chat on WhatsApp: ${gift.author.whatsapp}`}
                className="p-1 rounded bg-emerald-950/60 hover:bg-emerald-600/80 text-emerald-400 hover:text-white border border-emerald-800/60 transition-colors shrink-0 flex items-center justify-center shadow-sm"
              >
                <MessageCircle className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="text-[9px] sm:text-[10px] text-slate-400 shrink-0">
            {lang === 'ar' ? `تحميل ${gift.downloadsCount}` : `已下载 ${gift.downloadsCount}`}
          </div>
        </div>
      </div>
    </div>
  );
};
