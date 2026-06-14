"use client";

import { useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "anystl-history";
const MAX_HISTORY = 20;
const HISTORY_EVENT = "anystl-history-change";
const EMPTY: string[] = [];

let cachedSnapshot: string[] = EMPTY;
let cachedRaw: string | null = null;

function readHistory(): string[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedSnapshot;
    cachedRaw = raw;
    cachedSnapshot = raw ? (JSON.parse(raw) as string[]) : EMPTY;
    return cachedSnapshot;
  } catch {
    cachedRaw = null;
    cachedSnapshot = EMPTY;
    return EMPTY;
  }
}

function subscribeHistory(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(HISTORY_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(HISTORY_EVENT, callback);
  };
}

export function getHistory(): string[] {
  return readHistory();
}

export function addToHistory(query: string) {
  const history = getHistory();
  const filtered = history.filter((q) => q.toLowerCase() !== query.toLowerCase());
  filtered.unshift(query);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_HISTORY)));
  window.dispatchEvent(new Event(HISTORY_EVENT));
}

function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(HISTORY_EVENT));
}

interface Props {
  onSelect: (query: string) => void;
}

export function SearchHistory({ onSelect }: Props) {
  const history = useSyncExternalStore(subscribeHistory, readHistory, () => EMPTY);
  const [open, setOpen] = useState(false);

  if (history.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Geçmiş
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 rounded-xl border border-slate-700/60 bg-[#111827] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/40">
            <span className="text-xs text-slate-400 font-medium">Arama Geçmişi</span>
            <button
              onClick={() => clearHistory()}
              className="text-[10px] text-red-400/70 hover:text-red-400 transition-colors"
            >
              Temizle
            </button>
          </div>
          <ul className="max-h-48 overflow-y-auto">
            {history.map((q, i) => (
              <li key={i}>
                <button
                  onClick={() => { onSelect(q); setOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800/60 transition-colors flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5 text-slate-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="truncate">{q}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
