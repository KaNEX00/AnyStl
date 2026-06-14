"use client";

import { SortOption } from "@/lib/types";

const options: { value: SortOption; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "likes-desc", label: "Likes: High → Low" },
  { value: "likes-asc", label: "Likes: Low → High" },
  { value: "downloads-desc", label: "Downloads: High → Low" },
  { value: "downloads-asc", label: "Downloads: Low → High" },
];

interface Props {
  value: SortOption;
  onChange: (v: SortOption) => void;
}

export function SortDropdown({ value, onChange }: Props) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="appearance-none rounded-xl border border-slate-700/60 bg-[#111827] text-sm text-slate-300 pl-3 pr-8 py-2 focus:outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
