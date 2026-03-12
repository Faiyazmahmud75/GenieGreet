
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, animate, useMotionTemplate } from 'framer-motion';
import { GeneratedWish, Occasion } from '../types';
import { OCCASION_THEMES } from '../lib/themes';
import { Sparkles, Gift, Music, VolumeX, ShieldCheck, Cake, MoonStar, Heart, PartyPopper, HeartHandshake, Download, Loader2, Link, Check, MousePointerClick } from 'lucide-react';
import { toPng } from 'html-to-image';



export interface WishCardRef {
  downloadImage: () => Promise<void>;
}

interface WishCardProps {
  wish: GeneratedWish | null;
  isLoading: boolean;
  isSharedView?: boolean;
  replayCount?: number;
  onCopyLink?: () => void;
  isCopied?: boolean;
  onInteract?: () => void;
}

const Floating3DIcon = React.memo(({ icon, delay }: { icon: string; delay: number }) => {
  const randoms = useMemo(() => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    zStart: Math.random() * 20,
    zEnd: Math.random() * 60 + 20,
    rotateX: Math.random() * 360,
    rotateY: Math.random() * 360,
    rotateZ: Math.random() * 360,
    duration: 10 + Math.random() * 10,
    scale: 0.6 + Math.random() * 0.8,
    opacity: 0.3 + Math.random() * 0.4
  }), []);

  return (
    <motion.div
      initial={{ opacity: 0, z: randoms.zStart, rotateX: randoms.rotateX }}
      animate={{
        opacity: [0, randoms.opacity, randoms.opacity, 0],
        x: [`${randoms.x}%`, `${(randoms.x + 5) % 100}%`],
        y: [`${randoms.y}%`, `${(randoms.y - 10) % 100}%`],
        rotateX: [randoms.rotateX, randoms.rotateX + 360],
        rotateY: [randoms.rotateY, randoms.rotateY + 180],
        rotateZ: [randoms.rotateZ, randoms.rotateZ + 90],
        scale: [randoms.scale, randoms.scale * 1.1, randoms.scale],
        z: [randoms.zStart, randoms.zEnd]
      }}
      transition={{
        duration: randoms.duration,
        repeat: Infinity,
        delay,
        ease: "linear"
      }}
      className="absolute text-3xl pointer-events-none select-none drop-shadow-xl filter blur-[0.2px]"
      style={{
        left: `${randoms.x}%`,
        top: `${randoms.y}%`,
        transformStyle: 'preserve-3d',
        willChange: 'transform, opacity'
      }}
    >
      {icon}
    </motion.div>
  );
});

const WishCard = React.forwardRef<WishCardRef, WishCardProps>(({ wish, isLoading, isSharedView, replayCount, onCopyLink, isCopied, onInteract }, ref) => {

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(!isSharedView);

  // Sync state if isSharedView changes after mount (e.g. hash routing)
  useEffect(() => {
    setHasInteracted(!isSharedView);
  }, [isSharedView, wish]);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const frontFaceRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  React.useImperativeHandle(ref, () => ({
    downloadImage: handleDownload
  }));

  const handleDownload = async () => {
    if (!frontFaceRef.current) return;
    try {
      setIsDownloading(true);
      await new Promise(resolve => setTimeout(resolve, 100)); // Let animations settle

      const dataUrl = await toPng(frontFaceRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#0f172a',
        style: {
          transform: 'none',
          boxShadow: 'none',
        }
      });

      const link = document.createElement('a');
      link.download = `WishCraft_${wish?.recipientName || 'Card'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download image:', err);
      alert("Oops! The magical image capture failed. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };


  const baseRotateX = useRef(0);
  const baseRotateY = useRef(0);
  const isDragging = useRef(false);

  // 3D Motion Values
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const rotateXSpring = useSpring(rotateX, { stiffness: 200, damping: 25 });
  const rotateYSpring = useSpring(rotateY, { stiffness: 200, damping: 25 });

  // Shine calculation based on rotation
  const shineX = useTransform(rotateYSpring, (val) => {
    let normalized = val % 360;
    if (normalized > 180) normalized -= 360;
    if (normalized < -180) normalized += 360;
    return 50 + (normalized / 45) * 50;
  });

  const shineY = useTransform(rotateXSpring, (val) => {
    let normalized = val % 360;
    if (normalized > 180) normalized -= 360;
    if (normalized < -180) normalized += 360;
    return 50 - (normalized / 45) * 50;
  });

  const glareBackground = useMotionTemplate`radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.7) 0%, transparent 12%), linear-gradient(105deg, transparent calc(${shineX}% - 10%), rgba(255,255,255,0.4) ${shineX}%, transparent calc(${shineX}% + 10%))`;

  useEffect(() => {
    if (wish?.message && hasInteracted) {
      const theme = OCCASION_THEMES[wish.occasion];
      if (theme?.audioUrl) {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
        setAudioError(false);
        const audio = new Audio(theme.audioUrl);
        audio.onplay = () => { setIsPlaying(true); setAudioBlocked(false); };
        audio.onpause = () => setIsPlaying(false);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => { setAudioError(true); setIsPlaying(false); };
        audio.volume = 0.5;
        audioRef.current = audio;
        audio.play().catch(() => setAudioBlocked(true));
      }

      return () => {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      };
    }
  }, [wish?.message, wish?.occasion, replayCount, hasInteracted]);

  const handleInteraction = () => {
    setHasInteracted(true);
    if (onInteract) onInteract();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Lock drag before card is revealed in shared view
    if (isSharedView && !hasInteracted) return;
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Lock 3D tilt before card is revealed in shared view
    if (isSharedView && !hasInteracted) return;
    if (isDragging.current) {
      // Reduce sensitivity (friction)
      baseRotateY.current += e.movementX * 0.4;
      baseRotateX.current -= e.movementY * 0.4;

      // Limit vertical rotation to prevent flipping over
      if (baseRotateX.current > 45) baseRotateX.current = 45;
      if (baseRotateX.current < -45) baseRotateX.current = -45;

      // Limit horizontal rotation
      if (baseRotateY.current > 45) baseRotateY.current = 45;
      if (baseRotateY.current < -45) baseRotateY.current = -45;

      rotateX.set(baseRotateX.current);
      rotateY.set(baseRotateY.current);
    } else {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const tiltX = ((mouseY / rect.height) - 0.5) * -30;
      const tiltY = ((mouseX / rect.width) - 0.5) * 30;

      rotateX.set(baseRotateX.current + tiltX);
      rotateY.set(baseRotateY.current + tiltY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);

    // Since it's clamped to +/- 45 degrees, back face never shows on release
    // Snap to 0 for a flat front-facing resting state
    baseRotateX.current = 0;
    baseRotateY.current = 0;

    rotateX.set(baseRotateX.current);
    rotateY.set(baseRotateY.current);
  };

  const handleMouseLeave = () => {
    if (!isDragging.current) {
      rotateX.set(baseRotateX.current);
      rotateY.set(baseRotateY.current);
    }
  };

  const backgroundIcons = useMemo(() => {
    if (!wish) return null;
    const theme = OCCASION_THEMES[wish.occasion];
    return (
      <div className="absolute inset-0 overflow-hidden preserve-3d pointer-events-none translate-z-[10px]">
        {[...theme.bgIcons, ...theme.bgIcons].map((icon, idx) => (
          <Floating3DIcon key={`theme-${idx}`} icon={icon} delay={idx * 1.5} />
        ))}
        {Array.from({ length: 15 }).map((_, idx) => (
          <Floating3DIcon key={`sparkle-${idx}`} icon="✨" delay={idx * 1.2} />
        ))}
      </div>
    );
  }, [wish?.occasion]);

  const theme = wish ? OCCASION_THEMES[wish.occasion] : null;

  const BackgroundSvg = useMemo(() => {
    if (!wish) return null;

    const customIconPaths: Partial<Record<Occasion, string>> = {
      [Occasion.Birthday]: '/birthday.svg',
      [Occasion.Eid]: '/Eid.svg',
      [Occasion.Valentine]: '/valentine.svg',
      [Occasion.NewYear]: '/new_year.svg',
      [Occasion.Anniversary]: '/anniversary.svg',
    };

    const iconPath = customIconPaths[wish.occasion];

    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none translate-z-[5px] will-change-transform">
        {iconPath ? (
          <img
            src={iconPath}
            alt={wish.occasion}
            className="w-48 h-48 md:w-[32rem] md:h-[32rem] opacity-20 object-contain drop-shadow-[0_0_20px_var(--primary-color)]"
            style={{ '--primary-color': theme?.primaryColor } as any}
          />
        ) : (
          <Sparkles className="w-48 h-48 md:w-[32rem] md:h-[32rem] opacity-20" style={{ color: theme?.primaryColor }} />
        )}
      </div>
    );
  }, [wish, theme]);

  const toggleAudio = () => {
    if (!audioRef.current || audioError) return;
    audioRef.current.paused ? audioRef.current.play().catch(() => setAudioBlocked(true)) : audioRef.current.pause();
  };

  if (isLoading) {
    return (
      <div className="w-full aspect-[4/5] rounded-[40px] bg-slate-800 flex flex-col items-center justify-center p-8 border border-slate-700 shadow-2xl">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-indigo-400 animate-pulse" />
        </div>
        <p className="mt-6 text-slate-400 font-medium animate-pulse tracking-wide uppercase text-xs">Forging Digital Magic...</p>
      </div>
    );
  }

  if (!wish) {
    return (
      <div className="w-full aspect-[4/5] rounded-[40px] border-2 border-dashed border-slate-700 bg-slate-900/20 flex flex-col items-center justify-center p-12 text-center group">
        <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity }} className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mb-6 shadow-xl">
          <Gift className="w-12 h-12 text-slate-500" />
        </motion.div>
        <h3 className="text-2xl font-bold text-slate-300 mb-2">3D Collective Awaits</h3>
        <p className="text-slate-500 max-w-xs text-sm">Design your card to see it in immersive 3D space.</p>
      </div>
    );
  }

  const textShadow3D = `0 1px 0 rgba(0,0,0,0.2), 0 2px 0 rgba(0,0,0,0.15), 0 3px 0 rgba(0,0,0,0.1), 0 4px 0 rgba(0,0,0,0.1), 0 5px 10px rgba(0,0,0,0.4), 0 10px 20px rgba(0,0,0,0.3)`;

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseLeave={handleMouseLeave}
      className="relative group w-full aspect-[4/5] perspective-[1500px] select-none touch-none"
    >
      <motion.div
        ref={cardRef}
        key={`${wish.message}-${replayCount}`}
        style={{ rotateX: rotateXSpring, rotateY: rotateYSpring, transformStyle: 'preserve-3d' }}
        className={`w-full h-full relative preserve-3d transition-transform duration-100 ${isSharedView && !hasInteracted ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
      >
        {/* THICKNESS STACKING LAYER APPROACH FOR 3D CURVES */}
        {/* We stack identical background layers slightly offset in Z space to create real 3D depth with perfect border radius */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={`depth-${i}`}
            className="absolute inset-0 bg-slate-800 rounded-[40px] preserve-3d pointer-events-none opacity-80"
            style={{ transform: `translateZ(${-i * 0.5}px)` }}
          />
        ))}

        {/* FRONT FACE */}
        <div
          ref={frontFaceRef}
          className="absolute inset-0 rounded-[40px] overflow-hidden preserve-3d border-2 border-white/40 translate-z-[3px] backface-hidden bg-transparent"
          style={{ boxShadow: `0 0 50px 5px ${theme.glowColor}, inset 0 0 20px rgba(255,255,255,0.3)` }}>

          {backgroundIcons}
          <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />

          {BackgroundSvg}

          {/* Holographic Shine Overlay */}
          <motion.div
            className="absolute inset-0 z-30 pointer-events-none rounded-[40px]"
            style={{
              background: glareBackground,
              mixBlendMode: 'overlay'
            }}
          />

          {/* Front Face Content - Only renders when interacted */}
          <AnimatePresence>
            {!hasInteracted ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0 z-50 flex flex-col items-center justify-center backface-hidden rounded-[40px] cursor-pointer"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  handleInteraction();
                }}
              >
                {/* Mystical gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[40px]" />
                <div className="absolute inset-0 bg-gradient-to-tr from-fuchsia-900/20 via-transparent to-indigo-900/30 rounded-[40px]" />

                {/* Animated dot grid */}
                <div
                  className="absolute inset-0 opacity-20 rounded-[40px]"
                  style={{ backgroundImage: `radial-gradient(circle at 2px 2px, ${theme.primaryColor} 1px, transparent 0)`, backgroundSize: '28px 28px' }}
                />

                {/* Floating sparkle emojis */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[40px]">
                  {[...theme.bgIcons.slice(0, 4), '✨', '⭐'].map((icon, idx) => (
                    <motion.div
                      key={`back-sparkle-${idx}`}
                      className="absolute text-2xl md:text-3xl pointer-events-none select-none"
                      style={{
                        left: `${10 + idx * 15}%`,
                        top: `${15 + (idx % 3) * 25}%`,
                      }}
                      animate={{
                        y: [0, -20, 0],
                        x: [0, idx % 2 === 0 ? 10 : -10, 0],
                        rotate: [0, 15, -15, 0],
                        opacity: [0.2, 0.6, 0.2],
                      }}
                      transition={{
                        duration: 4 + idx * 0.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: idx * 0.8,
                      }}
                    >
                      {icon}
                    </motion.div>
                  ))}
                </div>

                {/* Central mystical content */}
                <div className="relative z-20 flex flex-col items-center text-center px-8 gap-6">
                  {/* Glowing orb behind gift */}
                  <motion.div
                    className="relative"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <motion.div
                      className="absolute -inset-6 md:-inset-8 rounded-full"
                      style={{ background: `radial-gradient(circle, ${theme.glowColor} 0%, transparent 70%)` }}
                      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <div className="relative w-24 h-24 md:w-28 md:h-28 rounded-full flex items-center justify-center border-2 border-white/20 shadow-[0_0_60px_rgba(255,255,255,0.15)]" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))' }}>
                      <motion.div
                        animate={{ rotate: [0, -5, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Gift className="w-12 h-12 md:w-14 md:h-14 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
                      </motion.div>
                    </div>
                    <motion.div
                      className="absolute -inset-3 md:-inset-4 border-2 border-dashed rounded-full"
                      style={{ borderColor: `${theme.primaryColor}40` }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                    />
                  </motion.div>

                  {/* Message text */}
                  <div className="space-y-3 max-w-xs">
                    <motion.p
                      className="text-white/90 text-xl md:text-2xl font-serif italic leading-relaxed"
                      animate={{ opacity: [0.7, 1, 0.7] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      A special surprise<br />awaits you...
                    </motion.p>
                    <motion.p
                      className="text-white/50 text-sm font-medium tracking-wide"
                      animate={{ opacity: [0.4, 0.8, 0.4] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                    >
                      Someone crafted a little magic,<br />just for you ✨
                    </motion.p>
                  </div>

                  {/* Tap hint */}
                  <motion.div
                    className="flex flex-col items-center gap-2 mt-2"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center border border-white/20" style={{ background: `linear-gradient(135deg, ${theme.primaryColor}30, ${theme.primaryColor}10)` }}>
                      <MousePointerClick className="w-7 h-7 md:w-8 md:h-8 text-white/80" />
                    </div>
                    <p className="text-white/40 text-[10px] md:text-xs font-bold uppercase tracking-[0.25em]">
                      Tap to reveal
                    </p>
                  </motion.div>
                </div>

                {/* Corner accents */}
                <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-white/10 rounded-tl-lg" />
                <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-white/10 rounded-tr-lg" />
                <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-white/10 rounded-bl-lg" />
                <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-white/10 rounded-br-lg" />

                {/* Bottom watermark */}
                <img src="/logo.png" alt="GenieGreet" className="absolute bottom-8 w-28 md:w-36 opacity-30 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]" />
              </motion.div>
            ) : (
              <motion.div
                key="front-content"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="absolute inset-0 w-full h-full preserve-3d"
              >
                {/* New Lace & Hanging Emojis Decoration */}
                <div className="absolute top-0 left-0 w-full h-full overflow-visible z-40 preserve-3d pointer-events-none">
                  {/* Zigzag Lace */}
                  <div className="w-full h-16 absolute top-0 left-0" style={{ transform: 'translateZ(18px)' }}>
                    <svg width="100%" height="100%" className="drop-shadow-[0_8px_8px_rgba(0,0,0,0.6)]">
                      <defs>
                        <pattern id="zigzag" x="0" y="0" width="60" height="48" patternUnits="userSpaceOnUse">
                          <path d="M 0 0 L 30 40 L 60 0 Z" fill="rgba(255,255,255,0.15)" />
                          <path d="M 0 0 L 30 40 L 60 0" stroke="rgba(255,255,255,0.8)" strokeWidth="4" fill="none" strokeLinejoin="round" />
                          <path d="M 0 0 L 30 40 L 60 0" stroke={theme?.primaryColor || 'purple'} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
                          <circle cx="30" cy="40" r="5" fill="white" />
                          <circle cx="30" cy="40" r="2" fill={theme?.primaryColor || 'purple'} />
                        </pattern>
                      </defs>
                      <rect x="0" y="0" width="100%" height="48" fill="url(#zigzag)" />
                    </svg>
                  </div>

                  {/* Hanging Emojis */}
                  {[0, 1, 2, 3].map((i) => {
                    const bgIcons = theme?.bgIcons || ['✨', '🎈', '🎉', '🌟'];
                    const emoji = bgIcons[i % bgIcons.length];
                    const leftPositions = ['15%', '38%', '62%', '85%'];
                    const stringLengths = window.innerWidth < 768 ? [40, 70, 45, 75] : [80, 140, 90, 150];
                    const zDepths = [25, 35, 28, 40];

                    return (
                      <motion.div
                        key={`hanging-${i}`}
                        className="absolute top-0 flex flex-col items-center origin-top preserve-3d"
                        style={{
                          left: leftPositions[i],
                          transform: `translateZ(${zDepths[i]}px)`
                        }}
                        animate={{ rotateZ: [-4, 4, -4] }}
                        transition={{ duration: 3.5 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
                      >
                        <div className="w-[2px] bg-gradient-to-b from-white/90 to-white/20 rounded-full" style={{ height: stringLengths[i] }} />
                        <div className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,1)] -mt-1 z-10 border border-slate-200" />
                        <motion.div
                          className="text-2xl md:text-3xl mt-2"
                          style={{ willChange: 'transform' }}
                          animate={{ rotateY: [-20, 20, -20], scale: [1, 1.1, 1] }}
                          transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
                        >
                          {emoji}
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center z-20 translate-z-[40px]">
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 15, delay: 0.3 }}
                    className="mb-4 md:mb-8 relative"
                  >
                    <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border-2 border-white/50 shadow-2xl relative group-hover:scale-110 transition-transform duration-500 will-change-transform">
                      <motion.div animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="absolute inset-0 blur-lg rounded-full" style={{ backgroundColor: theme.primaryColor, transform: 'translateZ(0)' }} />
                      <span className="text-3xl md:text-5xl drop-shadow-lg relative z-10">{theme.bgIcons[0]}</span>
                    </div>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="absolute -inset-2 md:-inset-4 border-2 border-dashed border-white/20 rounded-full"
                    />
                  </motion.div>

                  <div className="translate-z-[20px] will-change-transform">
                    <motion.h2
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="text-4xl md:text-6xl font-serif text-white leading-tight italic drop-shadow-xl"
                    >
                      <span className="text-2xl md:text-3xl opacity-80 mr-2">Dear</span>
                      {wish.recipientName},
                    </motion.h2>
                  </div>

                  <div
                    className="max-h-[250px] md:max-h-[280px] flex items-start justify-center max-w-xl w-full relative translate-z-[30px] mb-4 overflow-y-auto scrollbar-hide py-2 px-2 pointer-events-auto"
                    onPointerDown={(e) => { e.stopPropagation(); }}
                    onPointerMove={(e) => { e.stopPropagation(); }}
                    onWheel={(e) => { e.stopPropagation(); }}
                    onTouchStart={(e) => { e.stopPropagation(); }}
                    onTouchMove={(e) => { e.stopPropagation(); }}
                  >
                    <motion.p
                      variants={{
                        visible: { transition: { staggerChildren: 0.03, delayChildren: 0.5 } },
                        hidden: {}
                      }}
                      initial="hidden"
                      animate="visible"
                      className="text-lg md:text-2xl font-bold leading-tight drop-shadow-2xl font-handwritten px-2 text-center mt-0 w-full"
                      style={{
                        color: '#ffffff',
                        textShadow: `0 0 15px ${theme.primaryColor}, 0 0 30px ${theme.glowColor}`
                      }}
                    >
                      {wish.message.split("").map((char, index) => (
                        <motion.span
                          key={index}
                          variants={{
                            visible: { opacity: 1, filter: "blur(0px)", y: 0, transition: { type: 'spring', damping: 12, stiffness: 200 } },
                            hidden: { opacity: 0, filter: "blur(4px)", y: 5 }
                          }}
                        >
                          {char}
                        </motion.span>
                      ))}
                    </motion.p>
                  </div>

                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }} className="mt-4 flex flex-col items-center translate-z-[35px]">
                    <p className="text-white/60 text-sm italic mr-12">With love,</p>
                    <p className="text-4xl md:text-6xl text-white font-signature ml-12" style={{ textShadow: textShadow3D }}>
                      {wish.senderName}
                    </p>
                  </motion.div>
                </div>

                <div className="absolute top-6 left-6 w-10 h-10 border-t-2 border-l-2 border-white/20 rounded-tl-lg" />
                <div className="absolute bottom-6 right-6 w-10 h-10 border-b-2 border-r-2 border-white/20 rounded-br-lg" />

                {/* Front Face Watermark */}
                <img src="/logo.png" alt="GenieGreet Watermark" className="absolute bottom-6 right-8 w-32 md:w-44 lg:w-48 opacity-50 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BACK FACE */}
        <div className="absolute inset-0 rounded-[40px] overflow-hidden bg-transparent border-2 border-slate-700/50 -translate-z-[3px] rotateY-180 backface-hidden flex flex-col items-center justify-center shadow-2xl" style={{ transform: 'rotateY(180deg) translateZ(3px)' }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 2px 2px, ${theme.primaryColor} 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />

          {BackgroundSvg}

          {/* Back Face Holographic Shine Overlay */}
          <motion.div
            className="absolute inset-0 z-10 pointer-events-none rounded-[40px] opacity-50"
            style={{
              background: glareBackground,
              mixBlendMode: 'overlay'
            }}
          />

          <div className="relative flex flex-col items-center gap-4 z-20">
            <div className="w-32 h-32 rounded-3xl bg-slate-800 border border-white/10 flex items-center justify-center rotate-45 shadow-2xl">
              <Sparkles className="w-16 h-16 text-indigo-500 -rotate-45" />
            </div>

            <p className="text-xl font-bold tracking-widest text-slate-400 mt-8">GENIEGREET</p>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-white/5">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Verified AI Generation</span>
            </div>
          </div>
          <div className="absolute bottom-8 text-[10px] text-slate-600 font-bold tracking-[0.5em] uppercase">Digital Asset ID #WC-7729</div>
        </div>
      </motion.div>

      {/* Control Overlays (Outside of 3D rotation) */}
      {!isLoading && wish && (
        <div className="gif-controls absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/95 backdrop-blur-2xl border border-white/10 p-2.5 rounded-2xl shadow-2xl z-[100] pointer-events-auto cursor-auto" onPointerDown={(e) => e.stopPropagation()}>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onCopyLink?.(); }}
              className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all shadow-lg ${isCopied ? 'bg-emerald-600 text-white shadow-emerald-500/20 scale-105' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:scale-105 active:scale-95 shadow-black/20'}`}
              title="Copy Link"
            >
              {isCopied ? <Check className="w-4 h-4" /> : <Link className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleAudio}
              disabled={audioError}
              className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all ${audioError ? 'bg-rose-900/50 text-rose-500' : isPlaying ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
            >
              {audioError ? <VolumeX className="w-4 h-4" /> : <Music className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />}
            </button>
            {audioBlocked && !audioError && (
              <button onClick={toggleAudio} className="px-4 py-2 bg-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap animate-pulse shadow-lg shadow-indigo-500/30">
                Unlock Audio
              </button>
            )}
          </div>
        </div>
      )}

      {/* Interaction Hint */}
      {wish && !isLoading && (
        <div className="absolute -top-12 md:-top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center gap-1 text-slate-500 pointer-events-none">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-indigo-400" />
            <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">Drag to Explore</span>
          </div>
          <span className="text-[7px] md:text-[8px] uppercase tracking-widest opacity-60">Hover for Depth</span>
        </div>
      )}
    </div>
  );
});

export default React.memo(WishCard);
