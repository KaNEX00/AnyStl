import { Page } from "playwright";
import { ModelResult, Platform } from "../types";
import { computeScore } from "../scoring";

const PLATFORM: Platform = "printables";
const AI_RE = /\bAI\b/i;

export async function scrapePrintables(page: Page, query: string): Promise<ModelResult[]> {
  const url = `https://www.printables.com/search/models?q=${encodeURIComponent(query)}`;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });

  // Wait for card grid to render
  await page.waitForSelector(".card-layout", { timeout: 15_000 }).catch(() => {});
  await page.evaluate(() => window.scrollBy(0, 1500));
  await page.waitForTimeout(2000);

  const results = await page.evaluate((platform: Platform) => {
    const items: Array<{
      title: string;
      url: string;
      thumbnail: string;
      likes: number;
      downloads: number | null;
      platform: Platform;
    }> = [];

    const cards = document.querySelectorAll(".card-layout");
    const seen = new Set<string>();

    for (const card of cards) {
      // Model link - the image link has class "card-image"
      const imageLink = card.querySelector('a[href*="/model/"]') as HTMLAnchorElement | null;
      if (!imageLink) continue;
      const href = imageLink.href;
      if (!href.match(/\/model\/\d+/)) continue;
      const fullUrl = href.startsWith("http") ? href : `https://www.printables.com${href}`;
      if (seen.has(fullUrl)) continue;
      seen.add(fullUrl);

      // Title from the text link (class "h clamp-two-lines")
      const titleLink = card.querySelector("a.h") as HTMLAnchorElement | null;
      const title = titleLink?.textContent?.trim() || "";
      if (!title || title.length < 2) continue;

      // Thumbnail - get the real image, not the avatar
      let thumbnail = "";
      const imgs = card.querySelectorAll("img");
      for (const img of imgs) {
        if (img.src && img.src.includes("media/prints")) {
          thumbnail = img.src;
          break;
        }
      }
      // Fallback to last image (usually the model image)
      if (!thumbnail && imgs.length > 0) {
        thumbnail = imgs[imgs.length - 1]?.src || "";
      }

      // Stats bar: "21.3K   4.9  508.4K" → [likes, rating, downloads]
      let likes = 0;
      let downloads: number | null = null;
      const statsBar = card.querySelector(".stats-bar");
      if (statsBar) {
        const statsText = statsBar.textContent?.trim() || "";
        const nums = statsText.match(/[\d,.]+[kKmM]?/g) || [];
        if (nums.length >= 3) {
          // Format: likes, rating, downloads
          likes = parseStatNum(nums[0]!);
          downloads = parseStatNum(nums[2]!);
        } else if (nums.length >= 1) {
          likes = parseStatNum(nums[0]!);
        }
      }

      items.push({ title, url: fullUrl, thumbnail, likes, downloads, platform });
    }

    function parseStatNum(s: string): number {
      const cleaned = s.replace(/,/g, "").trim();
      if (/[kK]$/i.test(cleaned)) return Math.round(parseFloat(cleaned) * 1000);
      if (/[mM]$/i.test(cleaned)) return Math.round(parseFloat(cleaned) * 1000000);
      return parseInt(cleaned, 10) || 0;
    }

    return items;
  }, PLATFORM);

  return results.map((r) => ({
    ...r,
    isAI: AI_RE.test(r.title),
    score: computeScore(r),
  }));
}
