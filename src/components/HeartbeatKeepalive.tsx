"use client";

import { useEffect } from "react";

// Keeps an SSE connection open to the launcher's heartbeat server on PORT+1.
// When this tab closes, the connection drops and the launcher shuts down.
export default function HeartbeatKeepalive() {
  useEffect(() => {
    const currentPort = window.location.port ? Number(window.location.port) : 80;
    const heartbeatPort = currentPort + 1;
    const url = `http://${window.location.hostname}:${heartbeatPort}/heartbeat`;

    let es: EventSource | null = null;
    try {
      es = new EventSource(url);
    } catch {
      return;
    }

    return () => {
      es?.close();
    };
  }, []);

  return null;
}
