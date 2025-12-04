"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import sdk from "@farcaster/frame-sdk";
import { motion, AnimatePresence } from "framer-motion";
import { Share2, Heart, Zap, Play, Crown, Users, Hash, Star, Trophy, Download, X, Loader2 } from "lucide-react";

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
// USER STATS INTERFACE
// ============================================================================
interface UserStats {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio: string;
  followerCount: number;
  followingCount: number;
  totalCasts: number;
  totalLikes: number;
  topChannel: { id: string; name: string; castsInChannel: number };
  topCast: { text: string; likes: number; recasts: number; hash: string };
  closestFriend: { fid: number; username: string; displayName: string; pfpUrl: string; interactionCount: number };
  persona: string;
  percentile: string;
}

// ============================================================================
// DIALOGUE TEMPLATES - Personalized & Randomized
// ============================================================================
interface DialogueTemplate {
  base: string;
  variants: string[];
  dynamic?: (stats: UserStats) => string;
}

const dialogueTemplates: Record<string, DialogueTemplate> = {
  awakening: {
    base: "In the year 2025, among millions of voices in the decentralized cosmos...",
    variants: [
      (stats: UserStats) => `You are in the **${stats.percentile}** with **${stats.totalCasts}** casts.`,
      (stats: UserStats) => `Your presence resonates - **${stats.totalCasts}** casts, **${stats.followerCount}** followers.`,
      (stats: UserStats) => `Among the elite **${stats.percentile}**, you've made your mark.`,
    ] as any,
    dynamic: (stats) => `You emerged as **${stats.percentile}** - a force to be reckoned with.`
  },
  journey: {
    base: "Every wanderer finds a place to call home. Your path led you here...",
    variants: [
      (stats: UserStats) => `Your sanctuary is **/${stats.topChannel.id}** - **${stats.topChannel.castsInChannel}** moments shared.`,
      (stats: UserStats) => `In **/${stats.topChannel.id}**, you've found your tribe - **${stats.topChannel.castsInChannel}** casts deep.`,
      (stats: UserStats) => `**/${stats.topChannel.id}** is where your voice matters most - **${stats.topChannel.castsInChannel}** times over.`,
    ] as any,
    dynamic: (stats) => `Your home is **/${stats.topChannel.id}** with **${stats.topChannel.castsInChannel}** casts.`
  },
  voice: {
    base: "Your words echoed across the network.",
    variants: [
      (stats: UserStats) => `**${stats.topCast.likes}** hearts resonated with your most powerful message.`,
      (stats: UserStats) => `Your voice reached **${stats.topCast.likes}** souls - **${stats.topCast.recasts}** amplified it further.`,
      (stats: UserStats) => `One cast, **${stats.topCast.likes}** connections made. This is your legacy.`,
    ] as any,
    dynamic: (stats) => `Your words reached **${stats.topCast.likes}** hearts.`
  },
  nakama: {
    base: "No hero walks alone. You found your companions in the digital realm...",
    variants: [
      (stats: UserStats) => `**@${stats.closestFriend.username}** - your closest ally. **${stats.closestFriend.interactionCount}** conversations that matter.`,
      (stats: UserStats) => `In **@${stats.closestFriend.username}**, you found your nakama. **${stats.closestFriend.interactionCount}** moments of connection.`,
      (stats: UserStats) => `**@${stats.closestFriend.username}** knows you best - **${stats.closestFriend.interactionCount}** exchanges of trust.`,
    ] as any,
    dynamic: (stats) => `Your closest ally is **@${stats.closestFriend.username}** - **${stats.closestFriend.interactionCount}** conversations deep.`
  },
  power: {
    base: "Your generosity knows no bounds.",
    variants: [
      (stats: UserStats) => `**${stats.followerCount}** followers trust your vision. You follow **${stats.followingCount}** builders.`,
      (stats: UserStats) => `Your influence spans **${stats.followerCount}** connections. You're connected to **${stats.followingCount}** minds.`,
      (stats: UserStats) => `**${stats.followerCount}** believe in you. You believe in **${stats.followingCount}** others.`,
    ] as any,
    dynamic: (stats) => `**${stats.followerCount}** followers, **${stats.followingCount}** following - your network is your power.`
  },
  persona: {
    base: "After all your adventures, this is who you truly are...",
    variants: [
      (stats: UserStats) => `You are **${stats.persona}** - ${stats.bio || "forever building, forever learning."}`,
      (stats: UserStats) => `**${stats.persona}** is your essence. ${stats.bio || "Your story continues..."}`,
      (stats: UserStats) => `The world knows you as **${stats.persona}**. ${stats.bio || "And that's just the beginning."}`,
    ] as any,
    dynamic: (stats) => `You are **${stats.persona}** - ${stats.bio || "a force in the Farcaster ecosystem."}`
  }
};

// Seeded random function for deterministic randomization per user
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Get personalized dialogue
const getPersonalizedDialogue = (
  chapterId: string,
  stats: UserStats | null,
  seed: number = 0
): string => {
  const template = dialogueTemplates[chapterId];
  if (!template) return "";

  if (!stats) return template.base;

  // Use dynamic if available
  if (template.dynamic) {
    return template.dynamic(stats);
  }

  // Pick variant based on seeded random
  const variantIndex = Math.floor(seededRandom(seed + stats.fid) * template.variants.length);
  const variant = template.variants[variantIndex] as any;

  if (typeof variant === "function") {
    return (variant as (stats: UserStats) => string)(stats);
  }
  return String(variant);
};

// ============================================================================
// SLIDE DATA - The Farcaster 6 (Visual Novel Chapters)
// ============================================================================
interface SlideData {
  id: string;
  chapter: string;
  title: string;
  titleJp: string;
  background: string;
  mainStat: string;
  dialogue: string;
  subText: string;
  icon: typeof Trophy;
  overlay: string;
  kenBurns: {
    initial: { scale: number; x: string; y: string };
    animate: { scale: number; x: string; y: string };
  };
}

// Generate slides based on user stats (or use defaults)
const generateSlidesData = (stats: UserStats | null): SlideData[] => [
  {
    id: "intro",
    chapter: "CHAPTER 1",
    title: "The Awakening",
    titleJp: "目覚め",
    background: "/images/bg-intro.png",
    mainStat: stats?.percentile || "Top 5%",
    dialogue: getPersonalizedDialogue("awakening", stats, 1),
    subText: stats ? `${stats.totalCasts} casts and counting. You emerged as one of the most active.` : "You emerged as one of the most active casters.",
    icon: Trophy,
    overlay: "from-indigo-900/60 via-transparent to-purple-900/40",
    kenBurns: {
      initial: { scale: 1.1, x: "0%", y: "0%" },
      animate: { scale: 1.2, x: "-5%", y: "-3%" }
    }
  },
  {
    id: "channel",
    chapter: "CHAPTER 2",
    title: "The Journey",
    titleJp: "旅路",
    background: "/images/bg-channel.png",
    mainStat: stats?.topChannel?.id ? `/${stats.topChannel.id}` : "/base",
    dialogue: getPersonalizedDialogue("journey", stats, 2),
    subText: stats?.topChannel ? `${stats.topChannel.castsInChannel} casts in your favorite channel.` : "420 casts in your favorite channel.",
    icon: Hash,
    overlay: "from-orange-900/50 via-transparent to-rose-900/40",
    kenBurns: {
      initial: { scale: 1.0, x: "0%", y: "0%" },
      animate: { scale: 1.15, x: "3%", y: "-2%" }
    }
  },
  {
    id: "top_cast",
    chapter: "CHAPTER 3",
    title: "The Voice",
    titleJp: "声",
    background: "/images/bg-cast.png",
    mainStat: stats?.topCast?.likes ? stats.topCast.likes.toLocaleString() : "892",
    dialogue: getPersonalizedDialogue("voice", stats, 3),
    subText: "Your words echoed across the network.",
    icon: Star,
    overlay: "from-emerald-900/50 via-transparent to-teal-900/40",
    kenBurns: {
      initial: { scale: 1.15, x: "-3%", y: "0%" },
      animate: { scale: 1.25, x: "2%", y: "-4%" }
    }
  },
  {
    id: "squad",
    chapter: "CHAPTER 4",
    title: "The Nakama",
    titleJp: "仲間",
    background: "/images/bg-squad.png",
    mainStat: stats?.closestFriend?.username ? `@${stats.closestFriend.username}` : "@dwr",
    dialogue: getPersonalizedDialogue("nakama", stats, 4),
    subText: stats?.closestFriend ? `${stats.closestFriend.interactionCount} conversations with your closest ally.` : "45 conversations with your closest ally.",
    icon: Users,
    overlay: "from-blue-900/50 via-transparent to-cyan-900/40",
    kenBurns: {
      initial: { scale: 1.0, x: "0%", y: "-5%" },
      animate: { scale: 1.1, x: "-2%", y: "0%" }
    }
  },
  {
    id: "degen",
    chapter: "CHAPTER 5",
    title: "Power Level",
    titleJp: "力",
    background: "/images/bg-degen.png",
    mainStat: stats?.followerCount ? stats.followerCount.toLocaleString() : "69,420",
    dialogue: getPersonalizedDialogue("power", stats, 5),
    subText: stats ? `Following ${stats.followingCount.toLocaleString()} builders across the realm.` : "Tipped to creators across the realm.",
    icon: Zap,
    overlay: "from-violet-900/70 via-fuchsia-900/30 to-purple-900/50",
    kenBurns: {
      initial: { scale: 1.2, x: "5%", y: "0%" },
      animate: { scale: 1.3, x: "-3%", y: "-5%" }
    }
  },
  {
    id: "persona",
    chapter: "FINAL CHAPTER",
    title: "True Identity",
    titleJp: "本性",
    background: "/images/bg-persona.png",
    mainStat: stats?.persona || "The Builder",
    dialogue: getPersonalizedDialogue("persona", stats, 6),
    subText: stats?.bio?.slice(0, 60) || "Always shipping, rarely sleeping.",
    icon: Crown,
    overlay: "from-rose-900/50 via-transparent to-amber-900/40",
    kenBurns: {
      initial: { scale: 1.0, x: "0%", y: "0%" },
      animate: { scale: 1.15, x: "0%", y: "-5%" }
    }
  }
];

// ============================================================================
// TYPEWRITER COMPONENT - Fixed for stable height
// ============================================================================
const TypewriterText = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    setDisplayedText("");
    setStarted(false);
    const startTimeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimeout);
  }, [text, delay]);

  useEffect(() => {
    if (!started) return;
    if (displayedText.length < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, 25);
      return () => clearTimeout(timeout);
    }
  }, [displayedText, text, started]);

  const isComplete = displayedText.length === text.length;

  return (
    <span className="whitespace-pre-wrap">
      {displayedText}
      {!isComplete && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.4, repeat: Infinity }}
          className="inline-block w-0.5 h-4 bg-cyan-300 ml-0.5 align-middle"
        />
      )}
    </span>
  );
};

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
    return () => { audioContextRef.current?.close(); };
  }, []);

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
  const downloadImage = useCallback(() => {
    if (!shareImageUrl) {
      console.error("No image URL available");
      return;
    }
    
    try {
      // Method 1: Direct download via data URL
      const link = document.createElement("a");
      link.download = `replaycaster-2025-${context?.user?.username || "share"}.png`;
      link.href = shareImageUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log("Download initiated successfully");
    } catch (error) {
      console.error("Download failed:", error);
      
      // Method 2: Fallback - Open in new tab
      try {
        const newTab = window.open(shareImageUrl, "_blank");
        if (!newTab) {
          alert("Please allow pop-ups to download the image");
        }
      } catch (fallbackError) {
        console.error("Fallback download also failed:", fallbackError);
        alert("Unable to download image. Please try again.");
      }
    }
  }, [shareImageUrl, context]);

  // Share to Warpcast
  const shareToWarpcast = useCallback(() => {
    const personaSlide = slidesData.find((s: SlideData) => s.id === "persona");
    const text = encodeURIComponent(`Just finished my Farcaster Replay 2025! 🎬✨\n\nI'm "${personaSlide?.mainStat || "The Builder"}" - what's your persona?\n\nCheck yours at frames.replaycaster.xyz`);
    const url = `https://warpcast.com/~/compose?text=${text}`;
    sdk.actions.openUrl(url);
  }, [slidesData]);

  // Sound Effect - Anime "whoosh" style
  const playSound = (freq: number, duration: number) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") ctx.resume();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  };

  // Navigation with flash transition
  const navigate = (direction: "next" | "prev") => {
    if (isTransitioning) return;
    
    const canNavigate = direction === "next" 
      ? currentIndex < slidesData.length - 1 
      : currentIndex > 0;
    
    if (!canNavigate) return;

    setIsTransitioning(true);
    playSound(direction === "next" ? 800 : 600, 0.15);
    
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
              playSound(1000, 0.2);
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
        <div className="flex gap-1.5 w-full max-w-md mx-auto">
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