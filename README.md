# AnyStl

Search **MakerWorld**, **Thingiverse**, and **Printables** at the same time.

I made this with Claude

## How to run

1. Install [Node.js 20+](https://nodejs.org)
2. Double-click the start script:
   - **Windows:** `start.cmd`
   - **Linux / macOS:** `start.sh`

That's it. The first run installs everything and opens `http://localhost:3000` in your browser. Later runs start instantly.

To stop: close the terminal window, or press `Ctrl+C`.

## How it works

Everything runs on your own machine. Searches go straight to the three sites — nothing is sent anywhere else.

Searches can take a moment — each site is fetched live, so give it a few seconds before results appear.

## Built with

- [Next.js](https://nextjs.org) 16 (React 19)
- [TypeScript](https://www.typescriptlang.org)
- [Tailwind CSS](https://tailwindcss.com) 4
- [Playwright](https://playwright.dev) with [playwright-extra](https://github.com/berstend/puppeteer-extra/tree/master/packages/playwright-extra) and [puppeteer-extra-plugin-stealth](https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth) for scraping
- [ESLint](https://eslint.org) 9
