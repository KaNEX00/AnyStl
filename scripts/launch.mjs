// AnyStl launcher: owns the Next.js server, opens the app in the user's
// default browser, and polls a heartbeat endpoint so we can shut down when
// the tab closes. Used by start.sh and start.cmd.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = process.env.PORT || '3000';
const URL = `http://localhost:${PORT}`;
const NO_OPEN = process.env.ANYSTL_NO_OPEN === '1';

const isWin = process.platform === 'win32';
const isMac = process.platform === 'darwin';

const nextBin = isWin
  ? 'node_modules\\.bin\\next.cmd'
  : 'node_modules/.bin/next';

const next = spawn(nextBin, ['start', '-p', PORT], {
  stdio: 'inherit',
  shell: isWin,
  // Put next-server in its own process group so we can signal it
  // along with any scraper chromiums it spawns.
  detached: !isWin,
});

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

function openInDefaultBrowser(url) {
  try {
    if (isWin) {
      // The empty "" is the window title arg for `start`, so a URL that
      // contains spaces isn't mistakenly read as the title.
      spawn('cmd', ['/c', 'start', '""', url], {
        stdio: 'ignore',
        detached: true,
      }).unref();
    } else if (isMac) {
      spawn('open', [url], { stdio: 'ignore', detached: true }).unref();
    } else {
      spawn('xdg-open', [url], { stdio: 'ignore', detached: true }).unref();
    }
  } catch (err) {
    console.error('Failed to open browser:', err?.message || err);
    console.error(`Open ${url} manually to continue.`);
  }
}

// Polls the heartbeat endpoint. Shuts down when the page has sent a goodbye
// or when we've heard nothing for STALE_MS (after an initial grace period so
// a slow first paint doesn't kill the server).
async function watchHeartbeat() {
  const endpoint = `${URL}/api/heartbeat`;
  const POLL_MS = 2_000;
  const STALE_MS = 10_000;
  const GRACE_MS = 30_000;
  const startedAt = Date.now();

  while (!shuttingDown) {
    await sleep(POLL_MS);
    try {
      const res = await fetch(endpoint, { method: 'GET' });
      if (!res.ok) continue;
      const { ageMs, goodbye } = await res.json();
      if (goodbye) return shutdown(0);
      if (Date.now() - startedAt > GRACE_MS && ageMs > STALE_MS) {
        return shutdown(0);
      }
    } catch {
      // Server unreachable — will be caught by the next-exit handler
      // if it actually died; otherwise transient, keep polling.
    }
  }
}

if (!NO_OPEN) {
  const ready = await waitForServer(URL);
  if (ready && !shuttingDown) {
    openInDefaultBrowser(URL);
    watchHeartbeat();
  }
}
