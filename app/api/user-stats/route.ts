import { NextRequest, NextResponse } from "next/server";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || "NEYNAR_API_DOCS"; // Use your own key

interface UserStats {
  // User Profile
  fid: number;
  username: string;
  displayName: string;
  pfpUrl: string;
  bio: string;
  followerCount: number;
  followingCount: number;
  
  // Computed Stats
  totalCasts: number;
  totalLikes: number;
  topChannel: {
    id: string;
    name: string;
    castsInChannel: number;
  };
  topCast: {
    text: string;
    likes: number;
    recasts: number;
    hash: string;
  };
  closestFriend: {
    fid: number;
    username: string;
    displayName: string;
    pfpUrl: string;
    interactionCount: number;
  };
  persona: string;
  percentile: string;
}

// Determine user persona based on their activity
function determinePersona(stats: Partial<UserStats>): string {
  const castCount = stats.totalCasts || 0;
  const likes = stats.totalLikes || 0;
  const followers = stats.followerCount || 0;

  if (castCount > 1000 && followers > 5000) return "The Legend";
  if (castCount > 500 && likes > 1000) return "The Influencer";
  if (followers > 10000) return "The Celebrity";
  if (castCount > 500) return "The Builder";
  if (likes > 500) return "The Curator";
  if (castCount > 100) return "The Active One";
  if (followers > 1000) return "The Rising Star";
  return "The Explorer";
}

// Calculate percentile based on activity
function calculatePercentile(stats: Partial<UserStats>): string {
  const score = (stats.totalCasts || 0) * 2 + (stats.totalLikes || 0) + (stats.followerCount || 0) * 0.1;
  
  if (score > 5000) return "Top 1%";
  if (score > 2000) return "Top 5%";
  if (score > 1000) return "Top 10%";
  if (score > 500) return "Top 20%";
  if (score > 200) return "Top 30%";
  return "Top 50%";
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "FID is required" }, { status: 400 });
  }

  try {
    // 1. Fetch user profile
    const userResponse = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      {
        headers: {
          accept: "application/json",
          api_key: NEYNAR_API_KEY,
        },
      }
    );
    const userData = await userResponse.json();
    const user = userData.users?.[0];

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Fetch user's casts (to calculate stats)
    const castsResponse = await fetch(
      `https://api.neynar.com/v2/farcaster/feed/user/casts?fid=${fid}&limit=150&include_replies=false`,
      {
        headers: {
          accept: "application/json",
          api_key: NEYNAR_API_KEY,
        },
      }
    );
    const castsData = await castsResponse.json();
    const casts = castsData.casts || [];

    // 3. Calculate total casts and find top cast
    let totalLikes = 0;
    let topCast = casts[0] || null;
    const channelCounts: Record<string, { count: number; name: string }> = {};
    const mentionCounts: Record<number, { count: number; user: any }> = {};

    for (const cast of casts) {
      const likes = cast.reactions?.likes_count || 0;
      totalLikes += likes;

      // Track top cast
      if (topCast && likes > (topCast.reactions?.likes_count || 0)) {
        topCast = cast;
      }

      // Track channel activity
      if (cast.channel?.id) {
        if (!channelCounts[cast.channel.id]) {
          channelCounts[cast.channel.id] = { count: 0, name: cast.channel.name || cast.channel.id };
        }
        channelCounts[cast.channel.id].count++;
      }

      // Track mentions for closest friend
      for (const mention of cast.mentioned_profiles || []) {
        if (!mentionCounts[mention.fid]) {
          mentionCounts[mention.fid] = { count: 0, user: mention };
        }
        mentionCounts[mention.fid].count++;
      }
    }

    // Find top channel
    let topChannel = { id: "farcaster", name: "Farcaster", castsInChannel: 0 };
    for (const [id, data] of Object.entries(channelCounts)) {
      if (data.count > topChannel.castsInChannel) {
        topChannel = { id, name: data.name, castsInChannel: data.count };
      }
    }

    // Find closest friend (most mentioned)
    let closestFriend = null;
    let maxInteractions = 0;
    for (const [fidStr, data] of Object.entries(mentionCounts)) {
      if (data.count > maxInteractions) {
        maxInteractions = data.count;
        closestFriend = {
          fid: parseInt(fidStr),
          username: data.user.username,
          displayName: data.user.display_name,
          pfpUrl: data.user.pfp_url,
          interactionCount: data.count,
        };
      }
    }

    // Build stats object
    const stats: UserStats = {
      fid: user.fid,
      username: user.username,
      displayName: user.display_name,
      pfpUrl: user.pfp_url,
      bio: user.profile?.bio?.text || "",
      followerCount: user.follower_count || 0,
      followingCount: user.following_count || 0,
      totalCasts: casts.length,
      totalLikes,
      topChannel,
      topCast: topCast
        ? {
            text: topCast.text?.slice(0, 100) + (topCast.text?.length > 100 ? "..." : ""),
            likes: topCast.reactions?.likes_count || 0,
            recasts: topCast.reactions?.recasts_count || 0,
            hash: topCast.hash,
          }
        : { text: "", likes: 0, recasts: 0, hash: "" },
      closestFriend: closestFriend || {
        fid: 3,
        username: "dwr.eth",
        displayName: "Dan Romero",
        pfpUrl: "https://i.imgur.com/Y3Oszaz.jpg",
        interactionCount: 0,
      },
      persona: "",
      percentile: "",
    };

    // Calculate persona and percentile
    stats.persona = determinePersona(stats);
    stats.percentile = calculatePercentile(stats);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
}
