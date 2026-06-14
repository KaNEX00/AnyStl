import { Page } from "playwright";
import { ModelResult, Platform } from "../types";
import { computeScore } from "../scoring";

const PLATFORM: Platform = "thingiverse";
const AI_RE = /\bAI\b/i;

export async function scrapeThingiverse(page: Page, query: string): Promise<ModelResult[]> {
  const url = `https://www.thingiverse.com/search?q=${encodeURIComponent(query)}&page=1&type=things&sort=relevant`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });

  // Wait for the actual card content to load (not just the container)
  await page.waitForSelector('.ItemCardHeader__itemCardTitle--TadFI, a[title][href*="thing:"]', {
    timeout: 15_000,
  }).catch(() => {});

  await page.evaluate(() => window.scrollBy(0, 1500));
  await page.waitForTimeout(3000);

  const results = await page.evaluate((platform: Platform) => {
    const items: Array<{
      title: string;
      url: string;
      thumbnail: string;
      likes: number;
      downloads: number | null;
      platform: Platform;
    }> = [];

    const cards = document.querySelectorAll(".item-card-container");
    const seen = new Set<string>();

    for (const card of cards) {
      // Find any link pointing to a thing page
      const allLinks = card.querySelectorAll('a[href*="thing:"]');
      let thingUrl = "";
      for (const link of allLinks) {
        const href = (link as HTMLAnchorElement).href;
        const match = href.match(/\/thing:\d+$/);
        if (match) {
          thingUrl = href;
          break;
        }
      }
      if (!thingUrl) continue;
      if (seen.has(thingUrl)) continue;
      seen.add(thingUrl);

      // Title: from the title link or title attribute
      const titleEl = card.querySelector('[class*="itemCardTitle"]') as HTMLElement | null;
      const title = titleEl?.getAttribute("title") || titleEl?.textContent?.trim() || "";
      if (!title || title.length < 2 || title === "Ad") continue;

      // Thumbnail
      const img = card.querySelector("img[src]") as HTMLImageElement | null;
      const thumbnail = img?.src || "";

      // Likes: the Like button has a .button-content span with the count
      let likes = 0;
      const likeButton = card.querySelector('button[aria-label="Like"]');
      if (likeButton) {
        const countSpan = likeButton.querySelector(".button-content");
        const text = countSpan?.textContent?.trim() || "0";
        const cleaned = text.replace(/,/g, "");
        if (/[kK]$/i.test(cleaned)) likes = Math.round(parseFloat(cleaned) * 1000);
        else if (/[mM]$/i.test(cleaned)) likes = Math.round(parseFloat(cleaned) * 1000000);
        else likes = parseInt(cleaned, 10) || 0;
      }

      items.push({
        title,
        url: thingUrl,
        thumbnail,
        likes,
        downloads: null,
        platform,
      });
    }

    return items;
  }, PLATFORM);

  return results.map((r) => ({
    ...r,
    isAI: AI_RE.test(r.title),
    score: computeScore(r),
  }));
}
