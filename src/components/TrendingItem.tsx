import type { AnalyzedRepo } from '../types';

interface TrendingItemProps {
  repo: AnalyzedRepo;
  onSelect: (repo: AnalyzedRepo) => void;
}

function formatWeeklyStars(text: string): string {
  const match = text.match(/([\d,]+)/);
  if (!match) return text;
  const num = parseInt(match[1].replace(/,/g, ''), 10);
  if (Number.isNaN(num)) return text;
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(num);
}

export function TrendingItem({ repo, onSelect }: TrendingItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(repo)}
      className="flex items-center gap-3 w-full mx-2 px-2.5 py-2 text-left rounded-xl
                 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]
                 active:bg-black/[0.07] dark:active:bg-white/[0.1]
                 transition-all duration-150 cursor-default
                 animate-fade-in-up"
      style={{ animationDelay: `${repo.rank * 30}ms`, maxWidth: 'calc(100% - 16px)' }}
    >
      <span className="text-xs font-semibold text-gray-300 dark:text-gray-600 w-4 text-right shrink-0 tabular-nums">
        {repo.rank}
      </span>

      <div className="flex flex-col min-w-0 flex-1 gap-0.5">
        <span className="text-[13px] font-medium text-gray-800 dark:text-gray-200 truncate leading-tight">
          {repo.name}
        </span>
        <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate leading-tight">
          {repo.owner}{repo.language ? ` · ${repo.language}` : ''}
        </span>
      </div>

      <div className="flex items-center gap-0.5 shrink-0">
        <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 tabular-nums">
          +{formatWeeklyStars(repo.weekly_stars)}
        </span>
        <span className="text-[10px] text-amber-500/70">★</span>
      </div>
    </button>
  );
}
