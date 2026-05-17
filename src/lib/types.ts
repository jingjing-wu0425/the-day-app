export interface Fragment {
  id: string;
  type: "text" | "photo" | "voice" | "summary";
  content: string;
  timestamp: string; // HH:mm
  imageUrl?: string;
  audioUrl?: string;
}

export interface DaySummary {
  date: string; // YYYY-MM-DD
  title: string;
  summary: string; // supports <b> tags for bold keywords
  fragments: Fragment[];
}

export interface TimelinePoint {
  time: string;
  position: number; // 0-100 percentage
}

export interface Profile {
  id: string;
  phone: string;
  nickname: string;
  created_at: string;
}

export type FriendshipStatus = "pending" | "accepted" | "rejected";

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  requester_profile?: Profile;
  addressee_profile?: Profile;
}
