import { UserStats } from "@/app/types";

export interface DialogueTemplate {
  base: string;
  variants: string[];
  dynamic?: (stats: UserStats) => string;
}

export const dialogueTemplates: Record<string, DialogueTemplate> = {
  awakening: {
    base: "In the year 2025, among millions of voices in the decentralized cosmos, only a few truly made their mark...",
    variants: [
      (stats: UserStats) => `In the vast ocean of Farcaster, you emerged as **${stats.percentile}**. With **${stats.totalCasts}** casts, you've carved your name into the protocol's history.`,
      (stats: UserStats) => `Your presence resonates across the network - **${stats.totalCasts}** casts, **${stats.followerCount}** souls who believe in your vision. This is your awakening.`,
      (stats: UserStats) => `Among the elite **${stats.percentile}**, you've risen above the noise. Every cast was a step toward greatness.`,
    ] as any,
    dynamic: (stats) => `You emerged as **${stats.percentile}** of all Farcaster users. In a world of endless noise, your voice broke through. This is where your story begins.`
  },
  journey: {
    base: "Every wanderer finds a place to call home. Through countless channels, your path led you to where you truly belong...",
    variants: [
      (stats: UserStats) => `Your sanctuary is **/${stats.topChannel.id}** - a place where **${stats.topChannel.castsInChannel}** of your thoughts found a home. This channel became your digital village.`,
      (stats: UserStats) => `In **/${stats.topChannel.id}**, you've found your tribe. **${stats.topChannel.castsInChannel}** casts later, this community knows your name and welcomes your voice.`,
      (stats: UserStats) => `**/${stats.topChannel.id}** is where your heart beats strongest - **${stats.topChannel.castsInChannel}** moments of connection, laughter, and shared dreams.`,
    ] as any,
    dynamic: (stats) => `Your journey led you to **/${stats.topChannel.id}**. With **${stats.topChannel.castsInChannel}** casts in this sanctuary, you've become part of something bigger than yourself.`
  },
  voice: {
    base: "Sometimes, a single message can move mountains. Your words found their way into the hearts of many...",
    variants: [
      (stats: UserStats) => `**${stats.topCast.likes}** hearts resonated with your most powerful message. In that moment, strangers became friends, and your voice echoed across the decentralized realm.`,
      (stats: UserStats) => `Your voice reached **${stats.topCast.likes}** souls, and **${stats.topCast.recasts}** chose to amplify your words. Some messages are meant to travel far.`,
      (stats: UserStats) => `One cast, **${stats.topCast.likes}** connections made. This is the power of authentic expression - your legacy in 280 characters or less.`,
    ] as any,
    dynamic: (stats) => `Your most beloved cast touched **${stats.topCast.likes}** hearts. In the endless scroll of content, your words made people stop, think, and feel. That's true impact.`
  },
  nakama: {
    base: "No hero walks alone. In the digital realm, true bonds are forged through shared moments and meaningful exchanges...",
    variants: [
      (stats: UserStats) => `**@${stats.closestFriend.username}** - your closest ally in this journey. Through **${stats.closestFriend.interactionCount}** conversations, you've built a friendship that transcends the blockchain.`,
      (stats: UserStats) => `In **@${stats.closestFriend.username}**, you found your nakama - a true companion. **${stats.closestFriend.interactionCount}** moments of connection, support, and shared adventures.`,
      (stats: UserStats) => `**@${stats.closestFriend.username}** knows your journey better than most. **${stats.closestFriend.interactionCount}** exchanges of trust, laughter, and mutual respect.`,
    ] as any,
    dynamic: (stats) => `Your closest ally is **@${stats.closestFriend.username}**. Through **${stats.closestFriend.interactionCount}** conversations, you've proven that even in web3, human connection is what matters most.`
  },
  power: {
    base: "True power isn't measured in tokens alone. It's measured in the community you've built and the trust you've earned...",
    variants: [
      (stats: UserStats) => `**${stats.followerCount}** followers trust your vision and await your next thought. You follow **${stats.followingCount}** builders, learning and growing together.`,
      (stats: UserStats) => `Your influence spans **${stats.followerCount}** connections - each one a person who chose to hear your voice. You're connected to **${stats.followingCount}** brilliant minds.`,
      (stats: UserStats) => `**${stats.followerCount}** believe in your journey. In return, you believe in **${stats.followingCount}** others. This is the network effect of trust.`,
    ] as any,
    dynamic: (stats) => `**${stats.followerCount}** followers have chosen to walk alongside you. You follow **${stats.followingCount}** builders you admire. Together, you're shaping the future of social.`
  },
  persona: {
    base: "After all your adventures, this is who you truly are...",
    variants: [
      (stats: UserStats) => `You are **${stats.persona}** - ${stats.bio || "forever building, forever learning."}`,
      (stats: UserStats) => `**${stats.persona}** is your essence. ${stats.bio || "Your story continues..."}`,
      (stats: UserStats) => `The world knows you as **${stats.persona}**. ${stats.bio || "And that's just the beginning."}`,
    ] as any,
    dynamic: (stats) => `You are **${stats.persona}**. ${stats.bio || "A unique force in the Farcaster ecosystem."} Your journey in 2025 has been extraordinary - and this is only the beginning of your story.`
  }
};

// Seeded random function for deterministic randomization per user
export const seededRandom = (seed: number): number => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Get personalized dialogue
export const getPersonalizedDialogue = (
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
