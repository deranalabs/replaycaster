import { Trophy, Hash, Star, Users, Zap, Crown } from "lucide-react";
import { UserStats, SlideData } from "@/app/types";
import { getPersonalizedDialogue } from "./dialogues";

export const generateSlidesData = (stats: UserStats | null): SlideData[] => [
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
