// Liveness state shared across Route Handlers. Stored on globalThis so it
// survives module re-evaluation (e.g. HMR or split bundles in `next start`).

type HeartbeatState = { lastHeartbeat: number; goodbye: boolean };

const g = globalThis as unknown as { __anystlHeartbeat?: HeartbeatState };

if (!g.__anystlHeartbeat) {
  g.__anystlHeartbeat = { lastHeartbeat: Date.now(), goodbye: false };
}

export function markHeartbeat(): void {
  g.__anystlHeartbeat!.lastHeartbeat = Date.now();
}

export function markGoodbye(): void {
  g.__anystlHeartbeat!.goodbye = true;
}

export function getHeartbeatState(): HeartbeatState {
  return { ...g.__anystlHeartbeat! };
}
