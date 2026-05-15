export interface Fragment {
  id: string;
  type: "text" | "photo";
  content: string;
  timestamp: string; // HH:mm
  imageUrl?: string;
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
