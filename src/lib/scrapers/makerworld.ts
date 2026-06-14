import { ModelResult, Platform } from "../types";
import { computeScore } from "../scoring";

const PLATFORM: Platform = "makerworld";
const AI_RE = /\bAI\b/i;
const API_URL = "https://makerworld.com/api/v1/search-service/select/design2";

interface MakerWorldHit {
  id: number;
  title: string;
  slug: string;
  cover: string;
  likeCount: number;
  downloadCount: number;
}

interface MakerWorldResponse {
  total: number;
  hits: MakerWorldHit[];
}

export async function scrapeMakerWorld(_page: unknown, query: string): Promise<ModelResult[]> {
  const url = `${API_URL}?keyword=${encodeURIComponent(query)}&limit=20&offset=0`;

  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      Accept: "application/json",
      Referer: `https://makerworld.com/en/search/models?keyword=${encodeURIComponent(query)}`,
    },
  });

  if (!resp.ok) {
    throw new Error(`MakerWorld API returned ${resp.status}`);
  }

  const data: MakerWorldResponse = await resp.json();

  return (data.hits || []).map((hit) => {
    const result = {
      title: hit.title,
      url: `https://makerworld.com/en/models/${hit.id}`,
      thumbnail: hit.cover,
      likes: hit.likeCount || 0,
      downloads: hit.downloadCount || 0,
      platform: PLATFORM,
    };
    return {
      ...result,
      isAI: AI_RE.test(result.title),
      score: computeScore(result),
    };
  });
}
