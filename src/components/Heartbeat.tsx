"use client";

import { useEffect } from "react";

// Signals liveness to the launcher script so it can tear down the Next.js
// server when the user closes this tab.
export default function Heartbeat() {
  useEffect(() => {
    const ping = () => {
      fetch("/api/heartbeat", { method: "POST", keepalive: true }).catch(() => {});
    };
    ping();
    const interval = setInterval(ping, 3000);

    // `pagehide` fires reliably on tab close on modern browsers (including
    // bfcache navigations); `beforeunload` covers older paths.
    const goodbye = () => {
      try {
        navigator.sendBeacon("/api/goodbye");
      } catch {
        // sendBeacon unavailable — best-effort keepalive POST.
        fetch("/api/goodbye", { method: "POST", keepalive: true }).catch(() => {});
      }
    };
    window.addEventListener("pagehide", goodbye);
    window.addEventListener("beforeunload", goodbye);

    return () => {
      clearInterval(interval);
      window.removeEventListener("pagehide", goodbye);
      window.removeEventListener("beforeunload", goodbye);
    };
  }, []);

  return null;
}
