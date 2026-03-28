import type { AnalyzedRepo } from '../types';

interface TrendingItemProps {
  repo: AnalyzedRepo;
  onSelect: (repo: AnalyzedRepo) => void;
  isFavorited: boolean;
  onToggleFavorite: (repo: AnalyzedRepo) => void;
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

function HeartIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 16 16"
        fill="currentColor"
        className="w-3.5 h-3.5"
      >
        <path d="M2.702 6.292C2.252 5.478 2 4.726 2 3.969 2 2.329 3.22 1 4.826 1c1.028 0 1.99.517 2.674 1.372.091.114.27.114.362 0C8.546 1.517 9.508 1 10.536 1 12.142 1 13.362 2.329 13.362 3.969c0 .757-.252 1.509-.702 2.323-.445.805-1.08 1.614-1.825 2.39C9.617 9.93 8.324 11.088 8 11.372c-.324-.284-1.617-1.443-2.835-2.69C4.42 7.906 3.784 7.097 3.34 6.292H2.702Z" />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className="w-3.5 h-3.5"
    >
      <path d="M4.826 2C3.796 2 3 2.898 3 3.969c0 .558.186 1.136.555 1.804.364.66.92 1.382 1.613 2.1C6.352 9.086 7.48 10.1 8 10.56c.52-.46 1.648-1.474 2.832-2.687.692-.718 1.249-1.44 1.613-2.1.369-.668.555-1.246.555-1.804C13 2.898 12.204 2 11.174 2c-.758 0-1.494.39-2.037 1.07a1.25 1.25 0 0 1-1.912 0C6.682 2.39 5.946 2 5.188 2H4.826ZM4.826 1C3.22 1 2 2.329 2 3.969c0 .757.252 1.509.702 2.323.445.805 1.08 1.614 1.825 2.39C5.745 9.93 7.038 11.088 7.362 11.372a1 1 0 0 0 1.276 0c.324-.284 1.617-1.443 2.835-2.69.745-.776 1.38-1.585 1.825-2.39.45-.814.702-1.566.702-2.323C14 2.329 12.78 1 11.174 1c-1.028 0-1.99.517-2.674 1.372a.25.25 0 0 1-.362 0C7.454 1.517 6.492 1 5.464 1H4.826Z" />
    </svg>
  );
}

export function TrendingItem({ repo, onSelect, isFavorited, onToggleFavorite }: TrendingItemProps) {
  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(repo);
  };

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

      <div
        role="button"
        tabIndex={0}
        onClick={handleFavoriteClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.stopPropagation();
            onToggleFavorite(repo);
          }
        }}
        className={`shrink-0 p-0.5 rounded transition-all duration-150
                    hover:scale-110 active:scale-95
                    ${isFavorited
                      ? 'text-red-400 dark:text-red-400'
                      : 'text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500'}`}
        aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <HeartIcon filled={isFavorited} />
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
