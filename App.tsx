
import React, { useState, useEffect, useCallback } from 'react';
import WishForm from './components/WishForm';
import WishCard, { WishCardRef } from './components/WishCard';
import { WishData, GeneratedWish, Occasion } from './types';
import { generateWish } from './services/geminiService';
import { Sparkles, Share2, Github, Plus, Volume2, Music, Link, Check, AlertCircle, RotateCcw, Download, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { OCCASION_THEMES } from './lib/themes';
import LZString from 'lz-string';


const App: React.FC = () => {
  const [wish, setWish] = useState<GeneratedWish | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSharedView, setIsSharedView] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [replayCount, setReplayCount] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [aiQuotaReached, setAiQuotaReached] = useState(false);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const wishCardRef = React.useRef<WishCardRef>(null);

  // Reusable celebration effect with occasion-specific emojis
  const triggerConfetti = useCallback((occasion?: Occasion) => {
    const duration = occasion === 'Valentine' ? 12 * 1000 : 8 * 1000;
    const animationEnd = Date.now() + duration;

    const icons = occasion ? OCCASION_THEMES[occasion].bgIcons : ['✨', '🎉', '🎊', '⭐'];
    const shapes = icons.map(icon => confetti.shapeFromText({ text: icon, scalar: 3 }));
    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const isMobile = window.innerWidth < 768;
    const scalar = isMobile ? 1.6 : 2.2;

    if (occasion === 'Valentine') {
      // Snow Style (Valentine)
      let skew = 1;
      const frame = () => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return;
        
        const ticks = Math.max(200, 500 * (timeLeft / duration));
        skew = Math.max(0.8, skew - 0.001);

        confetti({
          particleCount: isMobile ? 1 : 2,
          startVelocity: 0,
          ticks: ticks,
          origin: {
            x: Math.random(),
            y: (Math.random() * skew) - 0.2
          },
          shapes,
          gravity: randomInRange(0.4, 0.6),
          scalar: randomInRange(0.4, 1) * scalar,
          drift: randomInRange(-0.4, 0.4),
          zIndex: 100
        });

        requestAnimationFrame(frame);
      };
      frame();
      
    } else if (occasion === 'Birthday') {
      // School Pride Style (Birthday)
      const frame = () => {
        if (Date.now() > animationEnd) return;
        
        confetti({
          particleCount: isMobile ? 1 : 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          shapes,
          scalar,
          zIndex: 100
        });
        confetti({
          particleCount: isMobile ? 1 : 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          shapes,
          scalar,
          zIndex: 100
        });

        requestAnimationFrame(frame);
      };
      frame();
      
    } else {
      // Fireworks Style / Default (New Year, Eid, Anniversary)
      let defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100, shapes, scalar };
      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const baseParticleCount = isMobile ? 15 : 40;
        const particleCount = baseParticleCount * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);
    }
  }, []);

  const OCCASIONS = ['Birthday', 'Eid', 'Valentine', 'New Year', 'Anniversary'];

  // Robust URL-Safe Base64 Encoding
  const encodeData = (data: any) => {
    try {
      // Minify keys & omit defaults for ultra-short URLs
      const minified: any = {
        m: data.message,
        r: data.recipientName,
        s: data.senderName,
        o: OCCASIONS.indexOf(data.occasion)
      };

      if (data.colorTheme && data.colorTheme !== 'from-slate-800 to-slate-900') {
        minified.c = data.colorTheme;
      }
      if (data.mood && data.mood !== 'custom') {
        minified.d = data.mood;
      }

      const json = JSON.stringify(minified);

      // Convert UTF-16 string to standard binary string without blowing up chars like encodeURIComponent does
      const binaryString = String.fromCodePoint(...new TextEncoder().encode(json));
      const encoded = btoa(binaryString);

      // Make it strictly URL safe
      return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) {
      console.error("Encoding error:", e);
      return "";
    }
  };

  // Robust URL-Safe Decoding
  const decodeData = (str: string) => {
    try {
      // Legacy check for old LZString format (usually starts with N4)
      if (str.startsWith("N4")) {
        const decompressed = LZString.decompressFromEncodedURIComponent(str);
        if (decompressed) {
          const parsed = JSON.parse(decompressed);
          if (parsed.m !== undefined) {
            return {
              message: parsed.m,
              mood: parsed.d || 'custom',
              colorTheme: parsed.c || 'from-slate-800 to-slate-900',
              recipientName: parsed.r,
              senderName: parsed.s,
              occasion: typeof parsed.o === 'number' ? OCCASIONS[parsed.o] || parsed.o : parsed.o
            };
          }
          return parsed;
        }
      }

      // Convert URL-safe base64 back to standard base64
      let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4) base64 += '=';

      const binaryStr = atob(base64);
      let json = '';
      try {
        // Try the new, highly-compressed raw UTF8 decoding first
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        json = new TextDecoder().decode(bytes);
      } catch (e) {
        // Fallback for the brief window where encodeURIComponent was used
        json = decodeURIComponent(binaryStr);
      }

      const parsed = JSON.parse(json);

      // Expand minified keys
      if (parsed.m !== undefined) {
        return {
          message: parsed.m,
          mood: parsed.d || 'custom',
          colorTheme: parsed.c || 'from-slate-800 to-slate-900',
          recipientName: parsed.r,
          senderName: parsed.s,
          occasion: typeof parsed.o === 'number' ? OCCASIONS[parsed.o] || parsed.o : parsed.o
        };
      }

      return parsed;
    } catch (e) {
      console.error("Decoding error:", e);
      return null;
    }
  };

  // Smooth scroll to the WishCard
  const scrollToCard = () => {
    setTimeout(() => {
      const cardElement = document.getElementById('wish-card-container');
      if (cardElement) {
        cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Handle Shared Link on Mount and Hash Change
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      // We look for 'wish=' anywhere in the hash to be safe
      const match = hash.match(/wish=([^&]*)/);
      if (match && match[1]) {
        const encodedData = match[1];
        const decodedData = decodeData(encodedData);
        if (decodedData) {
          setWish(decodedData);
          setIsSharedView(true);
          setIsCardOpen(false);
          setError(null);
          scrollToCard();
        } else {
          setError("This magic link seems to be broken. Try creating a new one!");
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [triggerConfetti]);

  const handleGenerate = async (data: WishData) => {
    setIsLoading(true);
    setError(null);
    setIsSharedView(false);
    setIsCardOpen(true);
    try {
      if (data.manualMessage && data.manualMessage.trim()) {
        const manualWish: GeneratedWish = {
          message: data.manualMessage.trim(),
          mood: 'custom',
          colorTheme: 'from-slate-800 to-slate-900',
          recipientName: data.recipientName,
          senderName: data.senderName,
          occasion: data.occasion
        };
        setWish(manualWish);
        triggerConfetti(data.occasion);
        scrollToCard();
      } else {
        const result = await generateWish(data);
        setWish(result);
        triggerConfetti(result.occasion);
        scrollToCard();
      }
    } catch (err: any) {
      console.error(err);
      if (err?.message === 'QUOTA_EXCEEDED') {
        setAiQuotaReached(true);
        setError("AI generation limit reached. Please write a manual message or support us to expand the magic!");
      } else {
        setError("Failed to brew your magic wish. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplay = () => {
    if (!wish) return;
    setReplayCount(prev => prev + 1);
    triggerConfetti(wish.occasion);
  };

  const copyToClipboard = (text: string) => {
    const onCopySuccess = () => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(onCopySuccess)
        .catch((err) => {
          console.warn("Clipboard API failed, trying fallback:", err);
          fallbackCopyTextToClipboard(text, onCopySuccess);
        });
    } else {
      fallbackCopyTextToClipboard(text, onCopySuccess);
    }
  };

  const fallbackCopyTextToClipboard = (text: string, callback?: () => void) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful && callback) callback();
      else if (!successful) prompt("Could not auto-copy. Please copy this link manually:", text);
    } catch (err) {
      console.error("Fallback copy failed:", err);
      prompt("Could not auto-copy. Please copy this link manually:", text);
    }

    document.body.removeChild(textArea);
  };

  const getShareUrl = () => {
    if (!wish) return '';
    const encodedWish = encodeData(wish);
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#wish=${encodedWish}`;
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      if (wishCardRef.current) {
        await wishCardRef.current.downloadImage();
      }
    } finally {
      setIsDownloading(false);
    }
  };



  const handleShare = async () => {
    const shareUrl = getShareUrl();
    if (!shareUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Magic Wish for ${wish?.recipientName}`,
          text: `✨ I crafted a special magic card for you! Open it to see the animation.`,
          url: shareUrl,
        });
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          copyToClipboard(shareUrl);
        }
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const resetApp = () => {
    window.location.hash = '';
    setWish(null);
    setIsSharedView(false);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      {/* Elegant Ambient Background Layers */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden will-change-transform">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] animate-blob transform-gpu" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-fuchsia-900/20 blur-[100px] animate-blob animation-delay-2000 transform-gpu" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-violet-900/10 blur-[130px] animate-blob animation-delay-4000 transform-gpu" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <nav className="border-b border-white/5 bg-slate-900/30 backdrop-blur-xl sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
            <div className="flex items-center cursor-pointer" onClick={resetApp}>
              <div className="p-1 md:p-1.5 rounded-lg md:rounded-xl">
                <img src="/logo.png" alt="GenieGreet Logo" className="w-24 sm:w-28 md:w-32 object-contain drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isSharedView && (
                <button
                  onClick={resetApp}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-sm font-bold hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/10"
                >
                  <Plus className="w-4 h-4" />
                  Create Mine
                </button>
              )}
              <a href="https://github.com/faiyazmahmud75" target="_blank" rel="noopener noreferrer" className="p-2.5 hover:bg-white/5 rounded-xl transition-all border border-white/5">
                <Github className="w-5 h-5 text-slate-400" />
              </a>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 md:px-6 w-full pt-8 md:pt-12 pb-16 md:pb-24">
          {!isSharedView && !wish && (
            <header className="text-center max-w-3xl mx-auto mb-10 md:mb-16 space-y-4 md:space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
                Digital Connections, <span className="bg-gradient-to-r from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">Forged in Magic.</span>
              </h1>
              <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed">
                Create cinematic, 3D animated cards with manual input or AI.
                Share magic links with music, motion, and celebration.
              </p>
            </header>
          )}

          {isSharedView && !error && (
            <div className="text-center mb-8 flex flex-col items-center gap-2 animate-bounce">
              <div className="p-3 bg-indigo-500/20 rounded-full text-indigo-400">
                <Volume2 className="w-6 h-6" />
              </div>
              <p className="text-indigo-400 font-bold uppercase tracking-[0.2em] text-xs">Sound On • Magic Inside</p>
            </div>
          )}

          {error && (
            <div className="max-w-md mx-auto mb-12 p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center gap-4 text-rose-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <div className="flex flex-col gap-1">
                <p className="font-bold">Oops!</p>
                <p className="text-sm opacity-80">{error}</p>
                <button onClick={resetApp} className="text-xs underline font-bold mt-2 text-rose-300">Back to Home</button>
              </div>
            </div>
          )}

          <div className={`grid grid-cols-1 ${isSharedView ? 'lg:grid-cols-1 justify-center' : 'lg:grid-cols-12'} gap-12 items-start`}>
            {!isSharedView && (
              <div className="lg:col-span-5 space-y-6 md:space-y-8">
                <div className="bg-slate-800/30 border border-white/5 p-6 md:p-8 rounded-2xl md:rounded-3xl backdrop-blur-md shadow-2xl">
                  <div className="flex items-center gap-3 mb-6 md:mb-8">
                    <div className="w-1.5 h-5 md:h-6 bg-indigo-500 rounded-full" />
                    <h3 className="text-lg md:text-xl font-bold">Craft Your Card</h3>
                  </div>
                  <WishForm onSubmit={handleGenerate} isLoading={isLoading} aiQuotaReached={aiQuotaReached} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 md:p-6 rounded-2xl md:rounded-3xl bg-white/5 border border-white/5 flex items-start sm:flex-col gap-3">
                    <Music className="w-6 h-6 text-indigo-400 shrink-0" />
                    <div>
                      <p className="text-[10px] md:text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Themed Audio</p>
                      <p className="text-[10px] md:text-xs text-slate-500">Fixed curated sounds for every occasion.</p>
                    </div>
                  </div>
                  <div className="p-5 md:p-6 rounded-2xl md:rounded-3xl bg-white/5 border border-white/5 flex items-start sm:flex-col gap-3">
                    <Share2 className="w-6 h-6 text-fuchsia-400 shrink-0" />
                    <div>
                      <p className="text-[10px] md:text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Magic Links</p>
                      <p className="text-[10px] md:text-xs text-slate-500">Instant sharing with confetti.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div id="wish-card-container" className={`${isSharedView ? 'max-w-2xl mx-auto w-full' : 'lg:col-span-7'} space-y-8`}>
              {!isSharedView && (
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-fuchsia-500 rounded-full" />
                    <h3 className="text-xl font-bold">Live Preview</h3>
                  </div>
                </div>
              )}

              <WishCard ref={wishCardRef} wish={wish} isLoading={isLoading} isSharedView={isSharedView} replayCount={replayCount} onCopyLink={() => copyToClipboard(getShareUrl())} isCopied={isCopied} onInteract={() => { triggerConfetti(wish?.occasion); setIsCardOpen(true); }} />

              {wish && !isLoading && !error && isCardOpen && (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={handleShare}
                      className="flex-[2] min-w-[200px] py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group"
                    >
                      <Share2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      Share Magic Link
                    </button>
                    <button
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="flex-1 min-w-[150px] py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 border border-white/10 bg-slate-800/80 hover:bg-slate-700 text-slate-200"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          Download Card
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    onClick={handleReplay}
                    className="w-full py-3 px-6 rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20 font-bold flex items-center justify-center gap-2 transition-all active:scale-95 group"
                  >
                    <RotateCcw className="w-4 h-4 group-hover:-rotate-90 transition-transform duration-500" />
                    Replay Card
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="mt-auto py-8 md:py-12 border-t border-white/5 bg-slate-900/40">
          <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 text-center md:text-left">
            <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">
              Powered by <span className="text-slate-300">Gemini 3 Flash</span> & <span className="text-slate-300">Framer Motion</span><br />
              &copy; {new Date().getFullYear()} GenieGreet. Made with ❤️ by <a href="https://github.com/faiyazmahmud75" target="_blank" rel="noopener noreferrer" className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors">Faiyaz</a>
            </p>
            <div className="flex items-center gap-6 md:gap-8">
              <a href="#" className="text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">Privacy</a>
              <a href="#" className="text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">Feedback</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
