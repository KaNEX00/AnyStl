import { getBrowser, createStealthContext } from "../browser";
import { ModelResult } from "../types";
import { sortByScore } from "../scoring";
import { scrapeMakerWorld } from "./makerworld";
import { scrapePrintables } from "./printables";
import { scrapeThingiverse } from "./thingiverse";

export interface SearchResult {
  results: ModelResult[];
  errors: string[];
}

export async function searchAll(query: string): Promise<SearchResult> {
  const browser = await getBrowser();
  const context = await createStealthContext(browser);

  const errors: string[] = [];

  try {
    const [p1, p2] = await Promise.all([
      context.newPage(),
      context.newPage(),
    ]);

    const [makerworld, thingiverse, printables] = await Promise.allSettled([
      scrapeMakerWorld(null, query),
      scrapeThingiverse(p1, query),
      scrapePrintables(p2, query),
    ]);

    const results: ModelResult[] = [];

    if (makerworld.status === "fulfilled") {
      results.push(...makerworld.value);
    } else {
      const msg = `MakerWorld: ${makerworld.reason}`;
      console.error(msg);
      errors.push(msg);
    }

    if (thingiverse.status === "fulfilled") {
      results.push(...thingiverse.value);
    } else {
      const msg = `Thingiverse: ${thingiverse.reason}`;
      console.error(msg);
      errors.push(msg);
    }

    if (printables.status === "fulfilled") {
      results.push(...printables.value);
    } else {
      const msg = `Printables: ${printables.reason}`;
      console.error(msg);
      errors.push(msg);
    }

    return { results: sortByScore(results), errors };
  } finally {
    await context.close();
  }
}
