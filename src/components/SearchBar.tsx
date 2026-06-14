"use client";

import { useState, FormEvent } from "react";

interface Props {
  onSearch: (query: string) => void;
  isLoading: boolean;
  initialQuery?: string;
  compact?: boolean;
}

export function SearchBar({ onSearch, isLoading, initialQuery, compact }: Props) {
  const [query, setQuery] = useState(initialQuery ?? "");
  const [lastInitialQuery, setLastInitialQuery] = useState(initialQuery);

  if (initialQuery !== lastInitialQuery) {
    setLastInitialQuery(initialQuery);
    if (initialQuery !== undefined) setQuery(initialQuery);
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) onSearch(trimmed);
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative flex items-center rounded-xl border border-slate-700/60 bg-[#0c1425] focus-within:border-blue-500/50 transition-all">
          <svg
            className="absolute left-3 w-4 h-4 text-slate-500 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 3D models..."
            className="w-full bg-transparent pl-9 pr-20 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="absolute right-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-1.5 text-xs font-semibold text-white hover:from-blue-500 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              "Search"
            )}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center rounded-2xl border border-[#1e3a5f] bg-[#0c1425] shadow-lg shadow-blue-900/10 focus-within:border-blue-500/50 focus-within:shadow-blue-500/10 transition-all">
        <svg
          className="absolute left-4 w-5 h-5 text-slate-500 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search 3D models... e.g. "benchy", "phone stand", "vase"'
          className="w-full bg-transparent pl-12 pr-32 py-4 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
        />

        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="absolute right-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-white hover:from-blue-500 hover:to-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Searching
            </span>
          ) : (
            "Search"
          )}
        </button>
      </div>
    </form>
  );
}
