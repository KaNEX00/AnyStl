// AnyStl launcher: owns the Next.js server and the browser window so that
// closing one tears down the other. Used by start.sh and start.cmd.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from 'playwright';

const PORT = process.env.PORT || '3000';
const URL = `http://localhost:${PORT}`;
const NO_OPEN = process.env.ANYSTL_NO_OPEN === '1';

const nextBin = process.platform === 'win32'
  ? 'node_modules\\.bin\\next.cmd'
  : 'node_modules/.bin/next';

const isWin = process.platform === 'win32';

const next = spawn(nextBin, ['start', '-p', PORT], {
  stdio: 'inherit',
  shell: isWin,
  // Put next-server in its own process group so we can signal it
  // along with any scraper chromiums it spawns.
  detached: !isWin,
});

let browser = null;
let shuttingDown = false;

function killNext(signal) {
  try {
    if (!next.pid) return;
    if (isWin) {
      // Windows has no POSIX process groups — use taskkill /T to walk
      // the child tree (next-server + any scraper chromiums it spawned).
      const force = signal === 'SIGKILL' ? ['/F'] : [];
      spawn('taskkill', [...force, '/T', '/PID', String(next.pid)], {
        stdio: 'ignore',
        shell: true,
      });
    } else {
      process.kill(-next.pid, signal);
    }
  } catch {}
}

async function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (browser) {
    try { await browser.close(); } catch {}
    browser = null;
  }
  if (next.exitCode === null) {
    killNext('SIGTERM');
    const timeout = sleep(5000).then(() => 'timeout');
    const exit = once(next, 'exit').then(() => 'exit');
    if (await Promise.race([timeout, exit]) === 'timeout') {
      killNext('SIGKILL');
    }
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
next.on('exit', (code) => shutdown(code ?? 0));

async function waitForServer(url, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (shuttingDown) return false;
    try {
      const res = await fetch(url, { method: 'HEAD' });
      if (res.status < 500) return true;
    } catch {}
    await sleep(250);
  }
  return false;
}

if (!NO_OPEN) {
  const ready = await waitForServer(URL);
  if (ready && !shuttingDown) {
    try {
      browser = await chromium.launch({
        headless: false,
        args: ['--disable-blink-features=AutomationControlled'],
      });
      browser.on('disconnected', () => {
        browser = null;
        shutdown(0);
      });
      const context = await browser.newContext({ viewport: null });
      const page = await context.newPage();
      // Direct signal for "user closed the visible window/tab" — the
      // browser process can linger briefly on Linux, so don't wait for
      // 'disconnected' to fire.
      page.on('close', () => shutdown(0));
      context.on('close', () => shutdown(0));
      await page.goto(URL).catch(() => {});
    } catch (err) {
      console.error('Failed to open browser:', err?.message || err);
    }
  }
}
