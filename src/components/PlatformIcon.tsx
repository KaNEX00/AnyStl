"use client";

import { Platform } from "@/lib/types";

const platforms: Record<Platform, { label: string; dot: string; bg: string }> = {
  makerworld: { label: "MAKERWORLD", dot: "bg-green-400", bg: "bg-green-500/20 text-green-400 border-green-500/30" },
  thingiverse: { label: "THINGIVERSE", dot: "bg-blue-400", bg: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  printables: { label: "PRINTABLES", dot: "bg-orange-400", bg: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
};

export function PlatformBadge({ platform }: { platform: Platform }) {
  const { label, dot, bg } = platforms[platform];
  return (
    <span className={`${bg} border text-[10px] font-bold tracking-wider rounded-md px-2.5 py-1 inline-flex items-center gap-1.5`}>
      <span className={`${dot} w-2 h-2 rounded-full`} />
      {label}
    </span>
  );
}

export function PlatformPill({ platform, count }: { platform: Platform; count?: number }) {
  const { label, dot } = platforms[platform];
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-800/50 px-4 py-1.5 text-sm text-slate-300">
      <span className={`${dot} w-2.5 h-2.5 rounded-full`} />
      {label.charAt(0) + label.slice(1).toLowerCase()}
      {count !== undefined && (
        <span className="text-slate-500 font-medium">{count}</span>
      )}
    </span>
  );
}
