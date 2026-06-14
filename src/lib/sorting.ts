import { ModelResult, SortOption } from "./types";

/**
 * Sort results by the chosen option.
 *
 * Thingiverse has null downloads — when sorting by downloads we treat null as 0,
 * but use likes as a secondary sort so Thingiverse results don't randomly cluster.
 */
export function sortResults(results: ModelResult[], sort: SortOption): ModelResult[] {
  if (sort === "relevance") return results;

  const sorted = [...results];

  sorted.sort((a, b) => {
    switch (sort) {
      case "likes-desc":
        return b.likes - a.likes;
      case "likes-asc":
        return a.likes - b.likes;
      case "downloads-desc": {
        const da = a.downloads ?? 0;
        const db = b.downloads ?? 0;
        if (db !== da) return db - da;
        return b.likes - a.likes; // secondary: likes desc
      }
      case "downloads-asc": {
        const da = a.downloads ?? 0;
        const db = b.downloads ?? 0;
        if (da !== db) return da - db;
        return a.likes - b.likes; // secondary: likes asc
      }
      default:
        return 0;
    }
  });

  return sorted;
}
