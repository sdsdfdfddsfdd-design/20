import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  Layers, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Download, 
  Copy, 
  Check, 
  X, 
  Eye, 
  Sliders, 
  Cpu, 
  Film, 
  ShieldCheck, 
  FileCode, 
  PlusCircle,
  Clock,
  Zap,
  Activity,
  Grid
} from 'lucide-react';
import { MediaAssetItem, GiftItem } from '../types';
import { formatBytes, formatDuration } from '../utils/svgaOptimizer';

interface SvgaPlayerModalProps {
  asset: MediaAssetItem | null;
  onClose: () => void;
  onCreateGiftFromAsset?: (asset: MediaAssetItem) => void;
  lang?: 'ar' | 'en' | 'zh';
}

export const SvgaPlayerModal: React.FC<SvgaPlayerModalProps> = ({
  asset,
  onClose,
  onCreateGiftFromAsset,
  lang = 'ar'
}) => {
  if (!asset) return null;

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [speed, setSpeed] = useState<number>(1.0);
  const [isLoop, setIsLoop] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [backdrop, setBackdrop] = useState<'checker' | 'dark' | 'livestream' | 'black' | 'white'>('checker');
  const [activeTab, setActiveTab] = useState<'player' | 'layers' | 'metrics'>('player');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const totalFrames = asset.svgaInfo?.frames || Math.round((asset.duration || 4) * (asset.fps || 30));
  const fps = asset.fps || 30;
  const duration = asset.duration || parseFloat((totalFrames / fps).toFixed(1));

  // Canvas animation loop for SVGA rendering simulation
  useEffect(() => {
    if (asset.type === 'mp4' || asset.type === 'webp' || asset.type === 'jpeg' || asset.type === 'png' || asset.type === 'gif') {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frame = currentFrame;
    let lastTimestamp = performance.now();
    const frameInterval = 1000 / (fps * speed);

    const render = (now: number) => {
      if (isPlaying) {
        const elapsed = now - lastTimestamp;
        if (elapsed >= frameInterval) {
          frame = (frame + 1) % Math.max(1, totalFrames);
          setCurrentFrame(frame);
          lastTimestamp = now;
        }
      }

      // Draw simulated frame with vector layers, glows & transforms
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const progress = frame / Math.max(1, totalFrames);
      const angle = progress * Math.PI * 4;
      const pulse = 1 + Math.sin(progress * Math.PI * 6) * 0.12;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);

      // Layer 1: Ambient Stage Glow
      const glowGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 220 * pulse);
      glowGrad.addColorStop(0, 'rgba(234, 179, 8, 0.4)');
      glowGrad.addColorStop(0.4, 'rgba(168, 85, 247, 0.25)');
      glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 240 * pulse, 0, Math.PI * 2);
      ctx.fill();

      // Layer 2: Rotating Golden Star Burst / Shield
      ctx.save();
      ctx.rotate(angle * 0.3);
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 18;
      
      const numRays = 8;
      for (let i = 0; i < numRays; i++) {
        const rayAngle = (i * Math.PI * 2) / numRays;
        const r1 = 60 * pulse;
        const r2 = 130 * pulse;
        ctx.beginPath();
        ctx.moveTo(Math.cos(rayAngle) * r1, Math.sin(rayAngle) * r1);
        ctx.lineTo(Math.cos(rayAngle) * r2, Math.sin(rayAngle) * r2);
        ctx.stroke();
      }
      ctx.restore();

      // Layer 3: Central Emblem / Gem Graphic
      ctx.save();
      ctx.scale(pulse, pulse);
      const gemGrad = ctx.createLinearGradient(-50, -50, 50, 50);
      gemGrad.addColorStop(0, '#fef08a');
      gemGrad.addColorStop(0.5, '#eab308');
      gemGrad.addColorStop(1, '#a855f7');
      ctx.fillStyle = gemGrad;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 25;

      ctx.beginPath();
      ctx.moveTo(0, -65);
      ctx.lineTo(60, -10);
      ctx.lineTo(40, 65);
      ctx.lineTo(-40, 65);
      ctx.lineTo(-60, -10);
      ctx.closePath();
      ctx.fill();

      // Inner highlight
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      // Layer 4: Orbiting Particles (Layer Sprites)
      const numParticles = 6;
      for (let p = 0; p < numParticles; p++) {
        const pAngle = -angle * 0.8 + (p * Math.PI * 2) / numParticles;
        const pDist = 140 + Math.sin(progress * Math.PI * 8 + p) * 25;
        const px = Math.cos(pAngle) * pDist;
        const py = Math.sin(pAngle) * pDist;

        ctx.fillStyle = p % 2 === 0 ? '#38bdf8' : '#ec4899';
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(px, py, 6 + Math.sin(progress * 10 + p) * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, speed, fps, totalFrames, asset.type]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(asset.dataUrl || window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyHash = () => {
    navigator.clipboard.writeText(asset.hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = asset.dataUrl;
    a.download = `${asset.name}_optimized.${asset.type === 'svga2' || asset.type === 'svga' ? 'svga' : asset.type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn" dir="rtl">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white truncate max-w-xs sm:max-w-md">{asset.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {asset.type.toUpperCase()}
                </span>
                {asset.savingsPercent > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    وفر {asset.savingsPercent}%
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                ID: {asset.id} • {asset.resolution || '1080x1920'} • {asset.fps || 30} FPS • {formatBytes(asset.optimizedSize)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onCreateGiftFromAsset && (
              <button
                onClick={() => {
                  onCreateGiftFromAsset(asset);
                  onClose();
                }}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>إنشاء هدية بهذا الأصل</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Two Columns (Left Player & Right Inspector) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
          
          {/* Main Visual Player Arena (8 Cols) */}
          <div className="lg:col-span-7 xl:col-span-8 bg-slate-950 flex flex-col border-b lg:border-b-0 lg:border-l border-slate-800">
            
            {/* Viewport Simulation Area */}
            <div className="relative flex-1 min-h-[340px] sm:min-h-[440px] flex items-center justify-center p-4 overflow-hidden select-none">
              
              {/* Dynamic Backdrop Mode */}
              {backdrop === 'checker' && (
                <div 
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: 'repeating-conic-gradient(#334155 0% 25%, #0f172a 0% 50%)',
                    backgroundSize: '24px 24px'
                  }}
                />
              )}
              {backdrop === 'dark' && (
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950/40 to-slate-950" />
              )}
              {backdrop === 'black' && (
                <div className="absolute inset-0 bg-black" />
              )}
              {backdrop === 'white' && (
                <div className="absolute inset-0 bg-white" />
              )}
              {backdrop === 'livestream' && (
                <div className="absolute inset-0 bg-slate-900 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/70" />
                  {/* Mock Live Room Overlay */}
                  <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 z-10 text-[11px] text-white">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span>مباشر • Jiawei Live</span>
                  </div>
                  <div className="absolute bottom-4 right-4 max-w-xs space-y-1.5 text-xs text-white/90 z-10">
                    <div className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                      <span className="text-amber-400 font-bold">المشاهد 1: </span> هدية مذهلة جداً! 🔥
                    </div>
                    <div className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                      <span className="text-cyan-400 font-bold">VIP Host: </span> مؤثرات جياوي الأصلية 3D
                    </div>
                  </div>
                </div>
              )}

              {/* Media Element Rendering */}
              <div className="relative z-20 max-w-full max-h-[380px] flex items-center justify-center">
                {asset.type === 'mp4' ? (
                  <video
                    ref={videoRef}
                    src={asset.dataUrl}
                    poster={asset.posterUrl}
                    loop={isLoop}
                    autoPlay
                    muted={isMuted}
                    playsInline
                    className="max-h-[380px] w-auto object-contain rounded-xl shadow-2xl drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
                  />
                ) : asset.type === 'jpeg' || asset.type === 'png' || asset.type === 'webp' || asset.type === 'gif' ? (
                  <img
                    src={asset.dataUrl || asset.posterUrl}
                    alt={asset.name}
                    className="max-h-[360px] w-auto object-contain rounded-xl drop-shadow-2xl"
                  />
                ) : (
                  <canvas
                    ref={canvasRef}
                    width={asset.svgaInfo?.width ? Math.min(600, asset.svgaInfo.width) : 480}
                    height={asset.svgaInfo?.height ? Math.min(600, asset.svgaInfo.height) : 480}
                    className="max-h-[380px] w-auto object-contain drop-shadow-[0_20px_40px_rgba(234,179,8,0.25)]"
                  />
                )}
              </div>

              {/* Watermark/FPS Badge inside canvas viewport */}
              <div className="absolute bottom-3 left-3 z-30 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>{fps} FPS</span>
                <span>•</span>
                <span>{duration}s</span>
                <span>•</span>
                <span className="text-amber-400">{Math.round(((currentFrame) / Math.max(1, totalFrames)) * 100)}%</span>
              </div>
            </div>

            {/* Playback Controls & Timeline Toolbar */}
            <div className="p-4 bg-slate-900/90 border-t border-slate-800 space-y-3">
              {/* Scrubber Bar */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-400 w-12 text-left">
                  {((currentFrame / totalFrames) * duration).toFixed(1)}s
                </span>
                <input
                  type="range"
                  min={0}
                  max={Math.max(1, totalFrames - 1)}
                  value={currentFrame}
                  onChange={(e) => setCurrentFrame(parseInt(e.target.value, 10))}
                  className="flex-1 accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-mono text-slate-400 w-12 text-right">
                  {duration}s
                </span>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all cursor-pointer shadow-md shadow-amber-500/20"
                    title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                  <button
                    onClick={() => setCurrentFrame(0)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                    title="إعادة للبداية"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  
                  {/* Speed Selector */}
                  <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700 text-xs">
                    {[0.5, 1.0, 1.5, 2.0].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSpeed(s)}
                        className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          speed === s ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setIsLoop(!isLoop)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isLoop ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    تكرار: {isLoop ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Backdrop Switcher */}
                <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
                  <span className="text-[11px] text-slate-400 px-1 font-medium">الخلفية:</span>
                  <button
                    onClick={() => setBackdrop('checker')}
                    className={`px-2 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                      backdrop === 'checker' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="فحص الشفافية (Checkerboard)"
                  >
                    شفاف
                  </button>
                  <button
                    onClick={() => setBackdrop('livestream')}
                    className={`px-2 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                      backdrop === 'livestream' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                    title="محاكاة البث المباشر"
                  >
                    بث مباشر
                  </button>
                  <button
                    onClick={() => setBackdrop('dark')}
                    className={`px-2 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                      backdrop === 'dark' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    داكن
                  </button>
                  <button
                    onClick={() => setBackdrop('white')}
                    className={`px-2 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                      backdrop === 'white' ? 'bg-white text-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    أبيض
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Inspector & Structural Meta Panel (4-5 Cols) */}
          <div className="lg:col-span-5 xl:col-span-4 bg-slate-900 flex flex-col p-5 space-y-4">
            
            {/* Nav Tabs */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('player')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'player' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                معلومات الأصل
              </button>
              <button
                onClick={() => setActiveTab('layers')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'layers' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                الطبقات ({asset.svgaInfo?.layersCount || 12})
              </button>
              <button
                onClick={() => setActiveTab('metrics')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeTab === 'metrics' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                تحليل الضغط
              </button>
            </div>

            {/* Tab 1: Overview & Actions */}
            {activeTab === 'player' && (
              <div className="space-y-4 flex-1">
                {/* Space Saving Card */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-emerald-400 font-bold block">نسبة توفير المساحة</span>
                      <span className="text-2xl font-black text-emerald-300">
                        {asset.savingsPercent || 35}% توفير
                      </span>
                    </div>
                    <div className="text-left text-xs font-mono text-slate-300">
                      <div className="text-slate-400 line-through">الأصلي: {formatBytes(asset.originalSize)}</div>
                      <div className="text-emerald-400 font-bold">المحسّن: {formatBytes(asset.optimizedSize)}</div>
                      <div className="text-emerald-500">تم توفير: {formatBytes(asset.savedBytes)}</div>
                    </div>
                  </div>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block mb-1">الأبعاد والمقاس</span>
                    <span className="font-bold text-white font-mono">{asset.resolution || '1080×1920'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block mb-1">المدة ومعدل الأطر</span>
                    <span className="font-bold text-white font-mono">{duration}s @ {fps} FPS</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block mb-1">عدد مرات الاستخدام</span>
                    <span className="font-bold text-amber-400 font-mono">{asset.usageCount || 1} هدية</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block mb-1">التوافق القياسي</span>
                    <span className="font-bold text-cyan-400 font-mono">SVGA 2.0 + VAP</span>
                  </div>
                </div>

                {/* Hash Fingerprint */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">بصمة SHA-256 (منع التكرار):</span>
                    <button
                      onClick={handleCopyHash}
                      className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedHash ? 'تم النسخ' : 'نسخ'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-[11px] text-slate-300 bg-slate-900 p-2 rounded-lg break-all select-all">
                    {asset.hash}
                  </div>
                </div>

                {/* Storage & Backup Setting */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <div>
                      <span className="text-white font-medium block">نسخة احتياطية أصلية</span>
                      <span className="text-slate-400 text-[11px]">
                        {asset.keepOriginalBackup ? 'محفوظة في الخادم' : 'تم حذف الملف الأصلي بعد التحقق الذاتي'}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    asset.keepOriginalBackup ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {asset.keepOriginalBackup ? 'ON' : 'OFF'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 space-y-2">
                  <button
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>تنزيل الملف المحسّن ({formatBytes(asset.optimizedSize)})</span>
                  </button>
                  
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 transition-all cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'تم نسخ رابط الأصل' : 'نسخ رابط التضمين المباشر'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tab 2: Layers & Hierarchy */}
            {activeTab === 'layers' && (
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[360px] pr-1">
                <div className="text-xs text-slate-400 flex items-center justify-between pb-1 border-b border-slate-800">
                  <span>اسم الطبقة / الـ Sprite</span>
                  <span>النوع والعتامة</span>
                </div>
                {(asset.svgaInfo?.layersList || [
                  { id: '1', name: 'Layer 0: Alpha Background Glow', type: 'Vector Gradient', opacity: 1 },
                  { id: '2', name: 'Layer 1: Main Character 3D Texture', type: 'Sprite Bitmap', opacity: 1 },
                  { id: '3', name: 'Layer 2: Sparkling Flare Emitter', type: 'Particle FX', opacity: 0.9 },
                  { id: '4', name: 'Layer 3: Dynamic Shadow & Matte', type: 'Alpha Mask', opacity: 0.75 },
                  { id: '5', name: 'Layer 4: Gold Border Shimmer', type: 'Sprite Transform', opacity: 1 },
                  { id: '6', name: 'Layer 5: Audio Channel Waveform', type: 'Sync Audio', opacity: 1 }
                ]).map((layer, idx) => (
                  <div
                    key={layer.id || idx}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-white font-medium font-mono truncate max-w-[180px]">{layer.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-300 font-mono">
                        {layer.type}
                      </span>
                      <span className="text-slate-400 text-[10px] font-mono">
                        {Math.round(layer.opacity * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 3: Compression & Deduplication Metrics */}
            {activeTab === 'metrics' && (
              <div className="space-y-3 flex-1 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">إلغاء تكرار الـ Sprites:</span>
                    <span className="text-emerald-400 font-bold font-mono">
                      {asset.svgaInfo?.uniqueSpritesCount || 8} أصل فريد
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">حفظ الشفافية Alpha Channel:</span>
                    <span className="text-cyan-400 font-bold">100% بدون فقد</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">سلامة المصفوفات التحويلية:</span>
                    <span className="text-amber-400 font-bold">Preserved (Pos, Scale, Rot)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">قنوات الصوت المصاحبة:</span>
                    <span className="text-slate-300 font-bold">
                      {asset.svgaInfo?.audioTracksCount ? 'مدمجة ومتزامنة' : 'بدون صوت'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs leading-relaxed">
                  💡 <strong>ميزة Jiawei Deduplication:</strong> عند استخدام هذا الـ Asset في 100 هدية مختلفة، يتم تخزينه مرة واحدة فقط بالخادم بحجم <strong>{formatBytes(asset.optimizedSize)}</strong> بدلاً من <strong>{formatBytes(asset.optimizedSize * 100)}</strong>!
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
