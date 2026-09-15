import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Heart, 
  ShieldCheck, 
  Sparkles,
  MessageCircle,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { GiftItem, Language } from '../types';
import { translations } from '../utils/translations';

interface GiftModalProps {
  gift: GiftItem | null;
  onClose: () => void;
  lang: Language;
  onAddToCart: (gift: GiftItem) => void;
  onOpenPurchase: (gift: GiftItem) => void;
  allGifts: GiftItem[];
  onSelectGift: (gift: GiftItem) => void;
}

export const GiftModal: React.FC<GiftModalProps> = ({
  gift,
  onClose,
  lang,
  onOpenPurchase,
  allGifts,
  onSelectGift
}) => {
  const t = translations[lang];
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(14);
  const [streamBg, setStreamBg] = useState<'dark' | 'stage' | 'green'>('dark');
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (gift && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  }, [gift]);

  if (!gift) return null;

  const displayTitle = lang === 'ar' && gift.titleAr ? gift.titleAr : lang === 'en' && gift.titleEn ? gift.titleEn : gift.title;

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (videoRef.current.duration) {
        setDuration(videoRef.current.duration);
      }
    }
  };

  const handleTogglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleDownloadSample = () => {
    const element = document.createElement('a');
    const file = new Blob([
      `JIAWEI EFFECTS TEST SAMPLE PACKET\n` +
      `Gift: ${gift.title} (${gift.id})\n` +
      `Resolution: ${gift.resolution}\n` +
      `Formats: SVGA, VAP, MP4\n` +
      `Stream URL: ${gift.videoUrl}\n` +
      `License Notice: Genuine commercial test license.`
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${gift.id}_sample_spec.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const relatedGifts = allGifts.filter((g) => g.id !== gift.id).slice(0, 6);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 bg-black/90 sm:bg-black/85 backdrop-blur-md overflow-hidden"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl h-[94vh] sm:h-[90vh] md:h-[660px] bg-[#0d111a] rounded-t-3xl sm:rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Header Bar & Close Button */}
        <div className="flex sm:hidden items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/95 shrink-0 z-30">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-white truncate max-w-[200px]">
              {displayTitle}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700 shrink-0">
              {gift.id}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Desktop Close Button */}
        <button
          onClick={onClose}
          className="hidden sm:flex absolute top-2.5 right-2.5 z-30 p-2 rounded-full bg-black/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-colors shadow-lg"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Content Grid: 2 columns on desktop (md:grid-cols-12), stacked and scrollable on mobile */}
        <div className="flex-1 flex flex-col md:grid md:grid-cols-12 min-h-0 overflow-hidden">
          
          {/* LEFT: Video Player Stage (Compact and perfectly proportioned on mobile) */}
          <div className="md:col-span-7 bg-black p-2.5 sm:p-4 flex flex-col justify-between items-center relative border-b md:border-b-0 md:border-r border-slate-800 shrink-0 h-[210px] sm:h-[280px] md:h-full overflow-hidden">
            
            {/* Top Toolbar / Background Simulator */}
            <div className="w-full flex items-center justify-between mb-2 z-10 shrink-0">
              <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700 rounded-lg p-1 text-[11px]">
                <span className="text-slate-400 px-1">{t.streamBgSim}:</span>
                <button
                  onClick={() => setStreamBg('dark')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    streamBg === 'dark' ? 'bg-cyan-500/30 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.bgDark}
                </button>
                <button
                  onClick={() => setStreamBg('stage')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    streamBg === 'stage' ? 'bg-cyan-500/30 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.bgStage}
                </button>
                <button
                  onClick={() => setStreamBg('green')}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    streamBg === 'green' ? 'bg-cyan-500/30 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.bgGreen}
                </button>
              </div>

              <div className="text-[11px] text-cyan-400/80 font-mono pr-8 md:pr-0">
                {gift.resolution} · {gift.fps || 60}FPS
              </div>
            </div>

            {/* Video Canvas Stage with Centered Object Contain */}
            <div 
              className={`relative w-full flex-1 min-h-0 rounded-xl overflow-hidden shadow-inner transition-colors flex items-center justify-center ${
                streamBg === 'dark' 
                  ? 'bg-black' 
                  : streamBg === 'stage' 
                  ? 'bg-gradient-to-b from-indigo-950 via-slate-950 to-purple-950' 
                  : 'bg-[#00b140]'
              }`}
            >
              <video
                ref={videoRef}
                src={gift.videoUrl}
                loop
                muted={isMuted}
                playsInline
                onTimeUpdate={handleTimeUpdate}
                onClick={handleTogglePlay}
                className="w-full h-full object-contain cursor-pointer"
              />

              {/* Watermark badge */}
              <div className="absolute top-3 left-3 pointer-events-none opacity-40 flex items-center gap-1.5 text-xs text-white">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-bold tracking-wider">佳维特效 JIAWEI</span>
              </div>

              {/* Pause icon overlay */}
              {!isPlaying && (
                <div 
                  onClick={handleTogglePlay}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full bg-cyan-500/90 text-white flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 ml-1 fill-current" />
                  </div>
                </div>
              )}
            </div>

            {/* Compact Player Controls Bar */}
            <div className="w-full mt-2 space-y-1 shrink-0">
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                <span>{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max={duration || 14}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <span>{formatTime(duration)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleTogglePlay}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-200 transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
                  </button>
                </div>

                <div className="text-[10px] text-slate-400 font-mono">
                  MP4 / SVGA / VAP
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Product Specs & Direct WhatsApp Action (Takes 5 columns on md+) */}
          <div className="md:col-span-5 flex flex-col flex-1 min-h-0 bg-[#0f131c] overflow-hidden">
            
            {/* Scrollable details container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 scrollbar-thin">
              
              {/* Feature Badge */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-800/40 text-xs">
                <div className="flex items-center gap-1.5 text-cyan-300">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="font-semibold text-[11px]">{t.toolBadge}</span>
                </div>
                <button 
                  onClick={handleDownloadSample}
                  className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-medium border border-cyan-500/30"
                >
                  点击体验 →
                </button>
              </div>

              {/* Title & Metadata Line */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
                    {displayTitle}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                      {gift.id}
                    </span>
                    <span>文件: {gift.id.toLowerCase()}.mp4</span>
                  </div>
                </div>

                <button
                  onClick={() => setIsFavorited(!isFavorited)}
                  className={`p-2 rounded-xl border transition-colors ${
                    isFavorited 
                      ? 'bg-pink-500/20 border-pink-500/40 text-pink-400' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title={t.favorite}
                >
                  <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Formats Info Bar */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {lang === 'ar' ? 'الصيغ والمواصفات الفنية المرفقة:' : '已包含动效格式与文件体积:'}
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {gift.formats.map((fmt, i) => (
                    <div key={i} className="flex items-center justify-between p-1.5 rounded bg-slate-800/60 text-slate-300 text-[11px]">
                      <span className="font-medium truncate mr-1">{fmt.name}</span>
                      <span className="text-[10px] text-cyan-400 font-mono shrink-0">{fmt.size}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  {['SVGA', 'VAP', 'MP4', 'PAG', 'JSON', 'WEBP', 'GIF', 'MOV'].map((fmt) => (
                    <span key={fmt} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      {fmt}
                    </span>
                  ))}
                </div>
              </div>

              {/* Creator Card */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={gift.author.avatar}
                    alt={gift.author.name}
                    className="w-9 h-9 rounded-full object-cover border border-cyan-500/40 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-white truncate">{gift.author.name}</span>
                      {gift.author.verified && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {lang === 'ar' ? 'مصمم ومعد مؤثرات معتمد' : 'Verified Platform VFX Creator'}
                    </div>
                  </div>
                </div>

                {gift.author.whatsapp && (
                  <a
                    href={`https://wa.me/${gift.author.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                      lang === 'ar'
                        ? `مرحباً، أنا مهتم بالحصول على مؤثر البث [${displayTitle} - ${gift.id}] وأود الاستفسار عن التفاصيل والترخيص.`
                        : `Hello! I am interested in your live stream effect [${displayTitle} - ${gift.id}].`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow transition-all shrink-0 active:scale-95"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{lang === 'ar' ? 'واتساب المصمم' : 'WhatsApp'}</span>
                  </a>
                )}
              </div>

              {/* License Warranty Notice */}
              <div className="p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/30 text-[10px] text-amber-300/90 flex items-start gap-1.5 leading-relaxed">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>{t.licenseNotice}</span>
              </div>

              {/* Related Gifts Strip */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-[11px] font-bold text-slate-400 mb-2">
                  {t.relatedGifts}
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {relatedGifts.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => onSelectGift(rel)}
                      className="w-16 shrink-0 rounded-lg overflow-hidden border border-slate-800 hover:border-cyan-500/60 cursor-pointer group bg-slate-900"
                    >
                      <div className="aspect-square relative overflow-hidden bg-slate-950 flex items-center justify-center">
                        {rel.posterUrl ? (
                          <img
                            src={rel.posterUrl}
                            alt={rel.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <video
                            src={rel.videoUrl ? `${rel.videoUrl}#t=0.001` : undefined}
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="p-1 text-[9px] text-slate-300 truncate text-center">
                        {rel.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pinned Bottom Action Box with Price & Direct WhatsApp purchase */}
            <div className="p-3.5 sm:p-4 bg-slate-900/95 border-t border-slate-800 shrink-0 shadow-lg">
              <div className="flex items-baseline justify-between mb-2.5">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {lang === 'ar' ? 'سعر الحزمة الكاملة:' : 'Full Package Price:'}
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                    $ {gift.price} <span className="text-[11px] text-slate-400 font-sans font-normal">USD</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] text-slate-400">{t.vipEstPrice}:</div>
                  <div className="text-xs font-bold text-cyan-300 font-mono">
                    $ {gift.vipPrice} USD
                  </div>
                </div>
              </div>

              <button
                onClick={() => onOpenPurchase(gift)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>{t.buyNowBtn}</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
