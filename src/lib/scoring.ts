import { ModelResult } from "./types";

/**
 * Compute a popularity score for ranking.
 *
 * For platforms with downloads (MakerWorld, Printables):
 *   score = likes * 2 + downloads
 *
 * For Thingiverse (no download data):
 *   score = likes * 3
 *   The higher like-weight compensates for the missing download signal
 *   so Thingiverse results aren't systematically buried.
 */
export function computeScore(result: Omit<ModelResult, "score" | "isAI">): number {
  if (result.downloads === null || result.downloads === 0) {
    return result.likes * 3;
  }
  return result.likes * 2 + result.downloads;
}

export function sortByScore(results: ModelResult[]): ModelResult[] {
  return [...results].sort((a, b) => b.score - a.score);
}
