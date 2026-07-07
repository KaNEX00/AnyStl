// AnyStl launcher: owns the Next.js server and opens the URL in the user's
// default browser. A tiny SSE heartbeat server on PORT+1 tracks the tab —
// when it closes, the launcher tears down Next.js and exits.
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as sleep } from 'node:timers/promises';
import http from 'node:http';

const PORT = Number(process.env.PORT || 3000);
const HEARTBEAT_PORT = PORT + 1;
const URL = `http://localhost:${PORT}`;
const NO_OPEN = process.env.ANYSTL_NO_OPEN === '1';
const DISCONNECT_GRACE_MS = 2000;
const INITIAL_CONNECT_TIMEOUT_MS = 30_000;

const isWin = process.platform === 'win32';
const nextBin = isWin ? 'node_modules\\.bin\\next.cmd' : 'node_modules/.bin/next';

const next = spawn(nextBin, ['start', '-p', String(PORT)], {
  stdio: 'inherit',
  shell: isWin,
  // Put next-server in its own process group so we can signal it along
  // with any scraper chromiums it spawns.
  detached: !isWin,
});

let shuttingDown = false;
let heartbeatEverConnected = false;
let disconnectTimer = null;
const heartbeatConnections = new Set();

function killNext(signal) {
  try {
    if (!next.pid) return;
    if (isWin) {
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
  try { heartbeatServer.close(); } catch {}
  for (const res of heartbeatConnections) {
    try { res.end(); } catch {}
  }
  heartbeatConnections.clear();
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

const heartbeatServer = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
    });
    res.end();
    return;
  }
  if (req.url !== '/heartbeat') {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-store',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no',
  });
  res.write(': connected\n\n');
  const keepAlive = setInterval(() => {
    try { res.write(': ping\n\n'); } catch {}
  }, 15_000);

  heartbeatEverConnected = true;
  heartbeatConnections.add(res);
  if (disconnectTimer) { clearTimeout(disconnectTimer); disconnectTimer = null; }

  const onClose = () => {
    clearInterval(keepAlive);
    if (!heartbeatConnections.delete(res)) return;
    if (heartbeatConnections.size === 0 && heartbeatEverConnected && !shuttingDown) {
      disconnectTimer = setTimeout(() => {
        if (heartbeatConnections.size === 0 && !shuttingDown) shutdown(0);
      }, DISCONNECT_GRACE_MS);
    }
  };
  req.on('close', onClose);
  res.on('close', onClose);
});

heartbeatServer.on('error', (err) => {
  console.warn(`Heartbeat server could not bind on port ${HEARTBEAT_PORT}: ${err.message}`);
  console.warn('Automatic shutdown on tab close is disabled. Use Ctrl+C to stop.');
});
heartbeatServer.listen(HEARTBEAT_PORT, '127.0.0.1');

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
    if (process.platform === 'darwin') {
      spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
    } else if (isWin) {
      // `start` is a cmd builtin. First quoted arg is the window title.
      spawn('cmd', ['/c', 'start', '""', url], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch (err) {
    console.error('Failed to open default browser:', err?.message || err);
    console.error(`Open this URL manually: ${url}`);
  }
}

if (!NO_OPEN) {
  const ready = await waitForServer(URL);
  if (ready && !shuttingDown) {
    openInDefaultBrowser(URL);
    setTimeout(() => {
      if (!heartbeatEverConnected && !shuttingDown) {
        console.warn(
          '\nNo browser heartbeat received. If the tab is open, automatic ' +
          'shutdown on close will not work — use Ctrl+C to stop.\n',
        );
      }
    }, INITIAL_CONNECT_TIMEOUT_MS);
  }
}
