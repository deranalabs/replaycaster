export interface UserStats {
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

export interface SlideData {
  id: string;
  chapter: string;
  title: string;
  titleJp: string;
  background: string;
  mainStat: string;
  dialogue: string;
  subText: string;
  icon: any;
  overlay: string;
  kenBurns: {
    initial: { scale: number; x: string; y: string };
    animate: { scale: number; x: string; y: string };
  };
}
