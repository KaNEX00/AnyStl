export type Platform = "makerworld" | "thingiverse" | "printables";

export interface ModelResult {
  title: string;
  url: string;
  thumbnail: string;
  likes: number;
  downloads: number | null;
  platform: Platform;
  isAI: boolean;
  score: number;
}

export type SortOption =
  | "relevance"
  | "likes-desc"
  | "likes-asc"
  | "downloads-desc"
  | "downloads-asc";

export interface SearchResponse {
  query: string;
  results: ModelResult[];
}
