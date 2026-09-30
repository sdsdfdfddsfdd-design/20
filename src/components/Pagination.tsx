import React from 'react';
import { Language } from '../types';
import { translations } from '../utils/translations';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  lang: Language;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  lang
}) => {
  const t = translations[lang];

  if (totalPages <= 1) return null;

  // Generate page numbers
  const pages: number[] = [];
  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 my-6 sm:my-8 text-xs select-none">
      {/* First Button */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="px-3 py-1.5 rounded-xl bg-[#11141c] hover:bg-[#181d2a] disabled:opacity-40 disabled:hover:bg-[#11141c] text-slate-300 font-medium border border-slate-800 transition-colors"
      >
        {t.paginationFirst}
      </button>

      {/* Number Buttons */}
      {pages.map((p) => {
        const isActive = p === currentPage;
        return (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`min-w-[34px] h-[34px] px-2 rounded-xl text-xs font-bold transition-all ${
              isActive
                ? 'bg-[#181e2e] text-cyan-400 border border-cyan-500/70 shadow-sm shadow-cyan-500/20'
                : 'bg-[#11141c] hover:bg-[#181d2a] text-slate-300 border border-slate-800'
            }`}
          >
            {p}
          </button>
        );
      })}

      {/* Last Button */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="px-3 py-1.5 rounded-xl bg-[#11141c] hover:bg-[#181d2a] disabled:opacity-40 disabled:hover:bg-[#11141c] text-slate-300 font-medium border border-slate-800 transition-colors"
      >
        {t.paginationLast}
      </button>
    </div>
  );
};
