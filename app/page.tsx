"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import sdk from "@farcaster/frame-sdk";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Heart, Zap, Play, Crown, Users, Hash, Star, Trophy, Download, X, Loader2, Volume2, VolumeX } from "lucide-react";
import { TypewriterText } from "@/app/components/TypewriterText";
import { generateSlidesData } from "@/app/lib/slides";
import { playSound } from "@/app/lib/sounds";
import { UserStats, SlideData } from "@/app/types";

// ============================================================================
// FONTS - Anime Style Typography
// ============================================================================
const fontStyle = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Russo+One&family=M+PLUS+Rounded+1c:wght@400;700;900&display=swap');

.font-title { font-family: 'Russo One', sans-serif; }
.font-body { font-family: 'Nunito', sans-serif; }
.font-jp { font-family: 'M PLUS Rounded 1c', sans-serif; }

/* Anime text glow effect */
.text-glow {
  text-shadow: 0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(255,255,255,0.5), 0 0 80px rgba(255,255,255,0.3);
}

/* Subtle text shadow for readability */
.text-shadow {
  text-shadow: 0 2px 10px rgba(0,0,0,0.8), 0 4px 20px rgba(0,0,0,0.5);
}

/* Dialog box glow border */
.dialog-glow {
  box-shadow: 
    0 0 20px rgba(100, 149, 237, 0.3),
    0 0 40px rgba(100, 149, 237, 0.15),
    inset 0 1px 0 rgba(255,255,255,0.1);
}

/* Icon float animation */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}
.animate-float { animation: float 3s ease-in-out infinite; }
`;

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function ReplayCasterAnime() {
  const [showIntro, setShowIntro] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [context, setContext] = useState<Awaited<typeof sdk.context> | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Generate slidesData based on userStats
  const slidesData = generateSlidesData(userStats);

  // Initialize SDK and Audio
  useEffect(() => {
    const init = async () => {
      const ctx = await sdk.context;
      setContext(ctx);
      sdk.actions.ready();
    };
    init();
    
    if (typeof window !== "undefined") {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Initialize background music
    bgMusicRef.current = new Audio("/Replaycaster-2025.mp3");
    bgMusicRef.current.loop = true;
    bgMusicRef.current.volume = 0.25; // Balanced with SFX
    
    return () => { 
      audioContextRef.current?.close();
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current = null;
      }
    };
  }, []);

  // Music control functions
  const playMusic = useCallback(() => {
    if (bgMusicRef.current) {
      bgMusicRef.current.play().then(() => {
        setIsMusicPlaying(true);
      }).catch(err => console.log("Music autoplay blocked:", err));
    }
  }, []);

  const toggleMusic = useCallback(() => {
    if (!bgMusicRef.current) return;
    
    if (isMuted) {
      bgMusicRef.current.volume = 0.25;
      setIsMuted(false);
    } else {
      bgMusicRef.current.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted]);

  // Fetch user stats when context is available
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!context?.user?.fid) return;
      
      setIsLoadingStats(true);
      try {
        const response = await fetch(`/api/user-stats?fid=${context.user.fid}`);
        if (response.ok) {
          const data = await response.json();
          setUserStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch user stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchUserStats();
  }, [context?.user?.fid]);

  // Generate Twibbon Share Image
  const generateShareImage = useCallback(async () => {
    setIsGenerating(true);
    
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Canvas size (1:1 for social sharing)
      canvas.width = 1080;
      canvas.height = 1080;

      // Load images
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      };

      // Get user PFP or use default
      const pfpUrl = context?.user?.pfpUrl || "/replaycaster-2025.png";
      
      // Load twibbon and profile picture
      const [twibbon, pfp] = await Promise.all([
        loadImage("/twibbon/twibbon-1.png"),
        loadImage(pfpUrl).catch(() => loadImage("/replaycaster-2025.png"))
      ]);

      // Draw background (dark gradient)
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#0f0a1e");
      gradient.addColorStop(0.5, "#1a1030");
      gradient.addColorStop(1, "#0d0815");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw profile picture (FULL CANVAS - circular, centered)
      const pfpSize = 900;
      const pfpX = (canvas.width - pfpSize) / 2;
      const pfpY = (canvas.height - pfpSize) / 2;
      const pfpCenterX = canvas.width / 2;
      const pfpCenterY = canvas.height / 2;
      
      // Draw glow effect (multiple circles)
      ctx.fillStyle = "rgba(0, 212, 255, 0.2)";
      ctx.beginPath();
      ctx.arc(pfpCenterX, pfpCenterY, pfpSize / 2 + 30, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = "rgba(0, 212, 255, 0.1)";
      ctx.beginPath();
      ctx.arc(pfpCenterX, pfpCenterY, pfpSize / 2 + 60, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw profile picture with clip (FULL CIRCLE)
      ctx.save();
      ctx.beginPath();
      ctx.arc(pfpCenterX, pfpCenterY, pfpSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(pfp, pfpX, pfpY, pfpSize, pfpSize);
      ctx.restore();
      
      // Draw border around PFP
      ctx.strokeStyle = "rgba(0, 212, 255, 0.8)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(pfpCenterX, pfpCenterY, pfpSize / 2, 0, Math.PI * 2);
      ctx.stroke();

      // Draw twibbon overlay (full canvas)
      ctx.drawImage(twibbon, 0, 0, canvas.width, canvas.height);
      
      // Draw semi-transparent dark overlay at bottom for text readability
      const overlayHeight = 280;
      const overlayGradient = ctx.createLinearGradient(0, canvas.height - overlayHeight, 0, canvas.height);
      overlayGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      overlayGradient.addColorStop(0.3, "rgba(0, 0, 0, 0.4)");
      overlayGradient.addColorStop(1, "rgba(0, 0, 0, 0.7)");
      ctx.fillStyle = overlayGradient;
      ctx.fillRect(0, canvas.height - overlayHeight, canvas.width, overlayHeight);

      // Add username text
      const username = context?.user?.username || "farcaster_user";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 48px 'Russo One', sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 10;
      ctx.fillText(`@${username}`, canvas.width / 2, 680);

      // Add persona/stat text
      const personaSlide = slidesData.find((s: SlideData) => s.id === "persona");
      const persona = personaSlide?.mainStat || "The Builder";
      ctx.font = "bold 64px 'Russo One', sans-serif";
      ctx.fillStyle = "#00d4ff";
      ctx.fillText(persona, canvas.width / 2, 760);

      // Add year text
      ctx.font = "32px 'Nunito', sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillText("REPLAYCASTER 2025", canvas.width / 2, 820);

      // Generate data URL
      const dataUrl = canvas.toDataURL("image/png");
      setShareImageUrl(dataUrl);
      setShowShareModal(true);
    } catch (error) {
      console.error("Failed to generate share image:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [context, slidesData]);

  // Download share image
  const downloadImage = useCallback(async () => {
    if (!shareImageUrl) {
      console.error("No image URL available");
      return;
    }
    
    try {
      // Convert data URL to Blob
      const response = await fetch(shareImageUrl);
      const blob = await response.blob();
      const filename = `replaycaster-2025-${context?.user?.username || "share"}.png`;
      
      // Try Web Share API first (works great on mobile/Mini Apps)
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], filename, { type: "image/png" });
        const shareData = { files: [file] };
        
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          console.log("Shared via Web Share API");
          return;
        }
      }
      
      // Fallback: Direct download via anchor element
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = filename;
      link.href = blobUrl;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      
      console.log("Download initiated successfully");
    } catch (error) {
      console.error("Download failed:", error);
      alert("Long press on the image above to save it.");
    }
  }, [shareImageUrl, context]);

  // Share to Warpcast
  const shareToWarpcast = useCallback(() => {
    const personaSlide = slidesData.find((s: SlideData) => s.id === "persona");
    const text = encodeURIComponent(`Just finished my Farcaster Replay 2025! 🎬✨\n\nI'm "${personaSlide?.mainStat || "The Builder"}" - what's your persona?\n\nCheck yours: https://farcaster.xyz/miniapps/3Bv_v1NlYHZz/farcaster-replay-2025`);
    const url = `https://warpcast.com/~/compose?text=${text}`;
    sdk.actions.openUrl(url);
  }, [slidesData]);

  // Sound Effect - Use imported playSound function
  const playSoundEffect = useCallback((type: "next" | "prev" | "start" | "impact") => {
    playSound(audioContextRef.current, type);
  }, []);

  // Navigation with flash transition
  const navigate = (direction: "next" | "prev") => {
    if (isTransitioning) return;
    
    const canNavigate = direction === "next" 
      ? currentIndex < slidesData.length - 1 
      : currentIndex > 0;
    
    if (!canNavigate) return;

    setIsTransitioning(true);
    playSoundEffect(direction);
    
    setTimeout(() => {
      setCurrentIndex(prev => direction === "next" ? prev + 1 : prev - 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }, 150);
  };

  const currentSlide = slidesData[currentIndex];
  const Icon = currentSlide.icon;

  // ==================== INTRO SCREEN ====================
  if (showIntro) {
    return (
      <main className="relative h-screen w-full overflow-hidden">
        <style>{fontStyle}</style>
        
        {/* Background with Ken Burns */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.0 }}
          animate={{ scale: 1.15 }}
          transition={{ duration: 20, ease: "linear" }}
        >
          <img
            src="/images/bg-intro.png"
            alt="Intro Background"
            className="w-full h-full object-cover"
          />
        </motion.div>

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

        {/* Anime light rays */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-[200%] w-1 bg-gradient-to-b from-white/0 via-white/20 to-white/0 origin-top"
              style={{ 
                left: `${20 + i * 15}%`,
                top: "-50%",
                transform: `rotate(${-15 + i * 8}deg)`
              }}
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-white text-center px-6">
          
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, type: "spring", stiffness: 200 }}
            className="mb-8 relative flex items-center justify-center"
          >
            {/* Pulse rings */}
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute w-32 h-32 rounded-full border border-white/20"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: [1, 1.8, 2.2],
                  opacity: [0.4, 0.15, 0]
                }}
                transition={{ 
                  duration: 3,
                  delay: i * 0.8,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            ))}
            
            {/* Glassmorphism container */}
            <motion.div 
              className="relative p-5 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {/* Inner glow */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/20 via-transparent to-orange-500/20" />
              
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 rounded-3xl overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  animate={{ x: ["-200%", "200%"] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                />
              </motion.div>

              {/* Logo image */}
              <motion.img
                src="/replaycaster-2025.png"
                alt="ReplayCaster"
                className="relative w-20 h-20 object-contain"
                animate={{ rotate: [0, 2, -2, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="space-y-1"
          >
            <h1 className="font-title text-glow tracking-wide">
              <span className="block text-2xl md:text-3xl text-white/80">REPLAYCASTER</span>
              <span className="block text-5xl md:text-6xl text-white">2025</span>
            </h1>
            <p className="font-jp text-lg text-white/50 tracking-widest mt-2">
              あなたの物語
            </p>
            <p className="font-body text-xs text-white/30">Your Story Awaits</p>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="font-body text-white/70 mt-8 max-w-xs leading-relaxed"
          >
            A cinematic journey through your Farcaster year.
          </motion.p>

          {/* Start Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              playSoundEffect("start");
              playMusic();
              setShowIntro(false);
            }}
            className="mt-12 px-10 py-4 bg-white/10 backdrop-blur-md border border-white/30 rounded-full font-body font-bold text-white flex items-center gap-3 dialog-glow"
          >
            <Play size={20} fill="white" />
            <span>Begin Story</span>
          </motion.button>

          {/* Skip hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="absolute bottom-8 pb-[env(safe-area-inset-bottom,0px)] text-white/30 text-xs font-body"
          >
            Tap anywhere to continue
          </motion.p>
        </div>
      </main>
    );
  }

  // ==================== MAIN SLIDES ====================
  return (
    <main className="relative h-screen w-full overflow-hidden font-body">
      <style>{fontStyle}</style>

      {/* ===== LAYER 1: BACKGROUND WITH KEN BURNS ===== */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id}
          className="absolute inset-0"
          initial={{ opacity: 0, ...currentSlide.kenBurns.initial }}
          animate={{ opacity: 1, ...currentSlide.kenBurns.animate }}
          exit={{ opacity: 0 }}
          transition={{ 
            opacity: { duration: 0.5 },
            scale: { duration: 15, ease: "linear" },
            x: { duration: 15, ease: "linear" },
            y: { duration: 15, ease: "linear" }
          }}
        >
          <img
            src={currentSlide.background}
            alt={currentSlide.title}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient overlays for readability */}
      <div className={`absolute inset-0 bg-gradient-to-b ${currentSlide.overlay}`} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />

      {/* ===== FLASH TRANSITION ===== */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-50 bg-white"
          />
        )}
      </AnimatePresence>

      {/* ===== TOP: EPISODE INDICATOR ===== */}
      <div className="absolute top-0 left-0 right-0 z-20 px-4 sm:px-6" style={{ paddingTop: 'calc(env(safe-area-inset-top, 12px) + 8px)' }}>
        <div className="flex items-center gap-3 w-full max-w-md mx-auto">
          <div className="flex gap-1.5 flex-1">
            {slidesData.map((_, i) => (
              <div key={i} className="h-1 flex-1 bg-black/30 backdrop-blur-sm rounded-full overflow-hidden border border-white/10">
                <motion.div
                  className="h-full bg-white shadow-sm"
                  initial={{ width: "0%" }}
                  animate={{ width: i <= currentIndex ? "100%" : "0%" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            ))}
          </div>
          {/* Music Toggle Button */}
          <button
            onClick={toggleMusic}
            className="p-2 bg-black/40 backdrop-blur-sm rounded-full border border-white/20 hover:bg-black/60 transition-colors"
            aria-label={isMuted ? "Unmute music" : "Mute music"}
          >
            {isMuted ? (
              <VolumeX size={16} className="text-white/70" />
            ) : (
              <Volume2 size={16} className="text-white/70" />
            )}
          </button>
        </div>
      </div>

      {/* ===== LAYER 2: IMPACT ZONE (Center Stage) ===== */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6 pb-48">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            {/* Chapter */}
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-white/80 text-xs tracking-[0.3em] font-body mb-6 px-3 py-1 bg-black/30 backdrop-blur-sm rounded-full inline-block border border-white/10"
            >
              {currentSlide.chapter}
            </motion.p>

            {/* Floating Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="animate-float mb-6"
            >
              <div className="inline-flex p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/30 shadow-xl shadow-black/30">
                <Icon size={32} className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
              </div>
            </motion.div>

            {/* BIG STAT - The Hero */}
            <motion.div
              key={`stat-${currentSlide.id}`}
              initial={{ scale: 2.5, opacity: 0, y: -30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 15,
                delay: 0.3 
              }}
              className="mb-4"
            >
              <h1 className="font-title text-6xl md:text-7xl lg:text-8xl text-white text-glow tracking-tight">
                {currentSlide.mainStat}
              </h1>
              {currentSlide.id === "top_cast" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="flex items-center justify-center gap-2 mt-2"
                >
                  <Heart size={20} className="text-pink-400" fill="currentColor" />
                  <span className="text-pink-300 font-body text-lg">Likes</span>
                </motion.div>
              )}
            </motion.div>

            {/* Title + Japanese */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="font-title text-2xl md:text-3xl text-white text-shadow tracking-wide">
                {currentSlide.title}
              </h2>
              <p className="font-jp text-base text-white/50 mt-1">
                {currentSlide.titleJp}
              </p>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ===== TAP NAVIGATION AREAS ===== */}
      <div 
        className="absolute top-0 left-0 w-1/3 h-full z-30 cursor-pointer"
        onClick={() => navigate("prev")}
      />
      <div 
        className="absolute top-0 right-0 w-2/3 h-full z-30 cursor-pointer"
        onClick={() => navigate("next")}
      />

      {/* ===== LAYER 3: NARRATIVE DECK (Bottom) ===== */}
      <div className="absolute bottom-0 left-0 right-0 z-40 px-4 sm:px-6" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px) + 16px, 24px)' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="w-full max-w-xl mx-auto"
          >
            {/* Narrative Box */}
            <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-cyan-500/30 dialog-glow">
              
              {/* Corner decorations */}
              <div className="absolute -top-px -left-px w-4 h-4 border-t-2 border-l-2 border-cyan-400/60 rounded-tl-xl" />
              <div className="absolute -top-px -right-px w-4 h-4 border-t-2 border-r-2 border-cyan-400/60 rounded-tr-xl" />
              <div className="absolute -bottom-px -left-px w-4 h-4 border-b-2 border-l-2 border-cyan-400/60 rounded-bl-xl" />
              <div className="absolute -bottom-px -right-px w-4 h-4 border-b-2 border-r-2 border-cyan-400/60 rounded-br-xl" />

              {/* Dialogue - Typewriter */}
              <div className="text-white/95 text-sm sm:text-base leading-relaxed min-h-[48px] sm:min-h-[56px] font-body">
                <TypewriterText text={currentSlide.dialogue} delay={600} />
              </div>

              {/* Sub text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                className="text-cyan-300/80 text-sm mt-2 font-body"
              >
                {currentSlide.subText}
              </motion.p>

              {/* Navigation hint */}
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/10">
                <span className="text-white/25 text-xs">← Tap left</span>
                <span className="text-white/30 text-xs font-mono">
                  {currentIndex + 1} / {slidesData.length}
                </span>
                <span className="text-white/25 text-xs">Tap right →</span>
              </div>
            </div>

            {/* Share button on last slide */}
            {currentIndex === slidesData.length - 1 && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 300 }}
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(0, 212, 255, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                onClick={generateShareImage}
                disabled={isGenerating}
                className="w-full mt-6 py-3 sm:py-4 bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 rounded-xl font-bold text-white text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 border border-cyan-300/30 hover:border-cyan-300/60"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Share2 size={18} />
                    <span>Share Your Story</span>
                  </>
                )}
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ===== FLOATING PARTICLES ===== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-5">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/60 rounded-full"
            style={{
              left: `${15 + i * 15}%`,
              top: `${25 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 5 + i,
              repeat: Infinity,
              delay: i * 0.7,
            }}
          />
        ))}
      </div>

      {/* ===== SHARE MODAL ===== */}
      <AnimatePresence>
        {showShareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-slate-900 rounded-2xl p-4 border border-cyan-500/30"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X size={18} className="text-white" />
              </button>

              {/* Title */}
              <h3 className="font-title text-xl text-white text-center mb-4">
                Your Story Card
              </h3>

              {/* Preview Image */}
              {shareImageUrl && (
                <div className="relative rounded-xl overflow-hidden mb-4 border border-white/10">
                  <img
                    src={shareImageUrl}
                    alt="Share preview"
                    className="w-full aspect-square object-cover"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={downloadImage}
                  className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-body font-semibold text-white flex items-center justify-center gap-2 transition-colors"
                >
                  <Download size={18} />
                  Download Image
                </button>
                
                <button
                  onClick={shareToWarpcast}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl font-body font-semibold text-white flex items-center justify-center gap-2 shadow-lg"
                >
                  <Share2 size={18} />
                  Share on Warpcast
                </button>
              </div>

              {/* User info */}
              {context?.user && (
                <p className="text-center text-white/40 text-xs mt-4">
                  Sharing as @{context.user.username}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}