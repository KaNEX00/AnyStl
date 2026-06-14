"use client";

import { useState, useRef, useMemo } from "react";
import { SearchBar } from "@/components/SearchBar";
import { ModelCard } from "@/components/ModelCard";
import { PlatformPill } from "@/components/PlatformIcon";
import { SearchHistory, addToHistory } from "@/components/SearchHistory";
import { SortDropdown } from "@/components/SortDropdown";
import { ColumnSlider } from "@/components/ColumnSlider";
import { sortResults } from "@/lib/sorting";
import { ModelResult, Platform, SearchResponse, SortOption } from "@/lib/types";

export default function Home() {
  const [results, setResults] = useState<ModelResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [searchTime, setSearchTime] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [columns, setColumns] = useState(3);
  const [historyKey, setHistoryKey] = useState(0);
  const startRef = useRef<number>(0);

  const sortedResults = useMemo(() => sortResults(results, sortBy), [results, sortBy]);

  const platformCounts = results.reduce<Record<Platform, number>>(
    (acc, r) => {
      acc[r.platform] = (acc[r.platform] || 0) + 1;
      return acc;
    },
    { makerworld: 0, thingiverse: 0, printables: 0 }
  );


  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    setSearched(true);
    setSortBy("relevance");
    startRef.current = performance.now();

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Search failed");
      }
      const data: SearchResponse = await res.json();
      setResults(data.results);
      setSearchTime((performance.now() - startRef.current) / 1000);
      addToHistory(query);
      setHistoryKey((k) => k + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const hasResults = !isLoading && sortedResults.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col">
      {/* ── Hero (collapses once results appear) ── */}
      {!hasResults && (
        <header className="pt-12 pb-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center">
              <svg className="w-9 h-9 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent mb-2">
            AnyStl
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Meta-search engine for 3D printable models across
            <br />
            MakerWorld, Thingiverse &amp; Printables
          </p>
        </header>
      )}

      {/* ── Compact top bar (visible when results are showing) ── */}
      {hasResults && (
        <header className="sticky top-0 z-30 bg-[#0a0e1a]/90 backdrop-blur-md border-b border-slate-800/60">
          <div className="flex items-center gap-4 px-5 py-3">
            {/* Mini logo */}
            <button
              onClick={() => { setSearched(false); setResults([]); }}
              className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center">
                <svg className="w-4.5 h-4.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-sm font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent hidden sm:inline">
                AnyStl
              </span>
            </button>

            {/* Inline search bar */}
            <div className="flex-1 min-w-0">
              <SearchBar onSearch={handleSearch} isLoading={isLoading} compact />
            </div>
          </div>
        </header>
      )}

      {/* ── Search area (pre-results view) ── */}
      {!hasResults && (
        <div className="px-4 pb-2">
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
          <SearchHistory key={historyKey} onSelect={handleSearch} />
        </div>
      )}

      {/* ── Platform pills ── */}
      {!hasResults && (
        <div className="flex justify-center gap-3 px-4 pt-4 pb-6">
          <PlatformPill platform="makerworld" count={searched ? platformCounts.makerworld : undefined} />
          <PlatformPill platform="thingiverse" count={searched ? platformCounts.thingiverse : undefined} />
          <PlatformPill platform="printables" count={searched ? platformCounts.printables : undefined} />
        </div>
      )}

      {/* ── Content area (full-width) ── */}
      <div className="flex-1 w-full px-5 pb-6">
        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 animate-pulse">
              <svg className="w-8 h-8 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
            <p className="text-slate-400 text-sm">Searching across all platforms...</p>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="flex flex-col items-center py-20">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!searched && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mb-5">
              <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-300 mb-2">Search for 3D models</h2>
            <p className="text-slate-500 text-sm text-center max-w-md">
              Enter a query above to search across MakerWorld, Thingiverse, and Printables simultaneously.
            </p>
          </div>
        )}

        {/* No results */}
        {!isLoading && searched && results.length === 0 && !error && (
          <div className="flex flex-col items-center py-20">
            <p className="text-slate-400 text-sm">No results found. Try a different search term.</p>
          </div>
        )}

        {/* ── Results ── */}
        {hasResults && (
          <>
            {/* Toolbar row */}
            <div className="flex flex-wrap items-center justify-between gap-3 py-4">
              {/* Left: stats + platform pills */}
              <div className="flex items-center gap-4 flex-wrap">
                <p className="text-sm text-slate-400">
                  <span className="text-emerald-400 font-semibold">{sortedResults.length}</span> models
                  <span className="text-slate-600 ml-1.5">{searchTime.toFixed(1)}s</span>
                </p>
                <div className="hidden sm:flex items-center gap-2">
                  <PlatformPill platform="makerworld" count={platformCounts.makerworld} />
                  <PlatformPill platform="thingiverse" count={platformCounts.thingiverse} />
                  <PlatformPill platform="printables" count={platformCounts.printables} />
                </div>
              </div>

              {/* Right: sort + column slider */}
              <div className="flex items-center gap-4">
                <SortDropdown value={sortBy} onChange={setSortBy} />
                <div className="hidden md:flex">
                  <ColumnSlider value={columns} onChange={setColumns} />
                </div>
              </div>
            </div>

            {/* Responsive grid — inline style for dynamic column count */}
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(var(--cols), minmax(0, 1fr))`,
              }}
            >
              <style>{`
                :root { --cols: 1; }
                @media (min-width: 640px)  { :root { --cols: 2; } }
                @media (min-width: 1024px) { :root { --cols: ${columns}; } }
              `}</style>
              {sortedResults.map((model, i) => (
                <ModelCard
                  key={`${model.platform}-${model.url}-${i}`}
                  model={model}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="py-4 text-center border-t border-slate-800/50">
        <p className="text-xs text-slate-600">
          AnyStl &mdash; 3D Model Meta-Search Engine &bull; Not affiliated with MakerWorld, Thingiverse, or Printables
        </p>
      </footer>
    </div>
  );
}
