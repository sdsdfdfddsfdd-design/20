import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  MessageCircle, 
  Download, 
  ShoppingCart, 
  Sparkles, 
  ShieldCheck, 
  Layers 
} from 'lucide-react';
import { GiftItem, Language } from '../types';
import { translations } from '../utils/translations';
import { SvgaPlayer } from './SvgaPlayer';
import { resolveMediaUrl } from '../utils/mediaStorage';

interface SelectedDesignViewerProps {
  gift: GiftItem | null;
  lang: Language;
  onOpenDetails: (gift: GiftItem) => void;
  onAddToCart: (gift: GiftItem) => void;
  onBuyWhatsApp: (gift: GiftItem) => void;
}

export const SelectedDesignViewer: React.FC<SelectedDesignViewerProps> = ({
  gift,
  lang,
  onOpenDetails,
  onAddToCart,
  onBuyWhatsApp
}) => {
  const t = translations[lang];
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoSrc, setVideoSrc] = useState<string>('');

  useEffect(() => {
    if (gift?.videoUrl) {
      setVideoSrc(resolveMediaUrl(gift.videoUrl));
    }
  }, [gift?.videoUrl]);

  if (!gift) return null;

  const displayTitle = lang === 'ar' && gift.titleAr ? gift.titleAr : lang === 'en' && gift.titleEn ? gift.titleEn : gift.title;

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

  return (
    <div className="w-full mt-6 mb-8 rounded-3xl bg-[#0f121a] border border-slate-800/90 shadow-2xl p-4 sm:p-6 overflow-hidden">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.selectedDesign}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {displayTitle}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-black text-lg sm:text-xl">
            $ {gift.price} <span className="text-xs text-emerald-300/80 font-bold">USD</span>
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-mono text-cyan-300">
            {gift.formats?.[0]?.name ? gift.formats[0].name.split(' ')[0] : (isSvga ? 'SVGA' : 'MP4')}
          </span>
        </div>
      </div>

      {/* Large Preview Stage with Checkerboard Background (Exact Reference Video Style) */}
      <div className="relative aspect-square sm:aspect-video max-h-[380px] w-full rounded-2xl overflow-hidden bg-[#090b10] border border-slate-800 flex items-center justify-center p-4">
        {/* Transparent Checkerboard Pattern */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none" 
          style={{
            backgroundImage: `linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)`,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
          }}
        />

        {/* Live SVGA / Video Render */}
        {isSvga && gift.videoUrl ? (
          <SvgaPlayer
            src={videoSrc || gift.videoUrl}
            autoPlay={isPlaying}
            loop={true}
            isMuted={isMuted}
            backdrop="checker"
            className="w-full h-full object-contain"
          />
        ) : isVideo && videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay={isPlaying}
            loop
            muted={isMuted}
            playsInline
            className="w-full h-full object-contain"
          />
        ) : gift.posterUrl ? (
          <img
            src={gift.posterUrl}
            alt={displayTitle}
            className="w-full h-full object-contain"
          />
        ) : null}

        {/* Top Controls Overlay */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          <button
            onClick={() => onOpenDetails(gift)}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 backdrop-blur shadow-md transition-colors"
            title="Full Screen / Details"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span>ID: {gift.id}</span>
          <span>·</span>
          <span>{gift.resolution || '1080×1920'}</span>
          <span>·</span>
          <span>{gift.fps || 60}FPS</span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Buy on WhatsApp */}
          <button
            onClick={() => onBuyWhatsApp(gift)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{t.buyNowBtn}</span>
          </button>

          {/* View Details Modal */}
          <button
            onClick={() => onOpenDetails(gift)}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition-colors"
          >
            {t.viewDetails}
          </button>
        </div>
      </div>
    </div>
  );
};
