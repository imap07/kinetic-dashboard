"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  label?: string;
  onChange: (page: number) => void;
}

export function Pagination({
  page,
  total,
  limit,
  label = "items",
  onChange,
}: PaginationProps) {
  if (total <= 0) return null;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[#1e2530]">
      <p className="text-xs text-gray-500">
        Page {page} of {totalPages} &mdash; {total.toLocaleString()} {label}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="flex items-center justify-center w-7 h-7 rounded-lg border border-[#1e2530] text-gray-400 hover:text-gray-100 hover:border-[#2a3340] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="flex items-center justify-center w-7 h-7 rounded-lg border border-[#1e2530] text-gray-400 hover:text-gray-100 hover:border-[#2a3340] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
