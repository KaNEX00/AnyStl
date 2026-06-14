"use client";

import { ModelResult } from "@/lib/types";
import { PlatformBadge } from "./PlatformIcon";

function formatNumber(n: number | null): string {
  if (n === null) return "N/A";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export function ModelCard({ model }: { model: ModelResult }) {

  return (
    <a
      href={model.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-2xl bg-[#111827] border border-slate-800 hover:border-slate-600 transition-all overflow-hidden"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden">
        {model.thumbnail ? (
          <img
            src={model.thumbnail}
            alt={model.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}

        {/* Platform badge */}
        <div className="absolute top-3 left-3">
          <PlatformBadge platform={model.platform} />
        </div>

        {/* AI badge */}
        {model.isAI && (
          <div className="absolute top-3 right-3">
            <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-bold tracking-wider rounded-md px-2.5 py-1">
              AI
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="text-sm font-medium text-slate-200 line-clamp-2 leading-snug mb-3">
          {model.title}
        </h3>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-3">
            {/* Downloads */}
            <span title="Downloads" className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
              </svg>
              {formatNumber(model.downloads)}
            </span>
            {/* Likes */}
            <span title="Likes" className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {formatNumber(model.likes)}
            </span>
          </div>
        </div>
      </div>
    </a>
  );
}
