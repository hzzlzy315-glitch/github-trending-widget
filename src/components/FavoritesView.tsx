import { useT } from '../i18n';
import type { AnalyzedRepo, FavoriteRepo } from '../types';

interface FavoritesViewProps {
  favorites: FavoriteRepo[];
  onSelect: (repo: AnalyzedRepo) => void;
  onRemove: (repo: AnalyzedRepo) => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

export function FavoritesView({ favorites, onSelect, onRemove }: FavoritesViewProps) {
  const t = useT();

  if (favorites.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[13px] text-gray-400 dark:text-gray-500 select-none">
          {t('noFavorites')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {favorites.map((fav, index) => {
        const { repo } = fav;
        return (
          <button
            key={`${repo.owner}/${repo.name}`}
            type="button"
            onClick={() => onSelect(repo)}
            className="flex items-center gap-3 w-full mx-2 px-2.5 py-2 text-left rounded-xl
                       hover:bg-black/[0.04] dark:hover:bg-white/[0.06]
                       active:bg-black/[0.07] dark:active:bg-white/[0.1]
                       transition-all duration-150 cursor-default
                       animate-fade-in-up"
            style={{ animationDelay: `${index * 30}ms`, maxWidth: 'calc(100% - 16px)' }}
          >
            <div className="flex flex-col min-w-0 flex-1 gap-0.5">
              <span className="text-[13px] font-medium text-gray-800 dark:text-gray-200 truncate leading-tight">
                {repo.name}
              </span>
              <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate leading-tight">
                {repo.owner}{repo.language ? ` · ${repo.language}` : ''}
                {' · '}{formatDate(fav.favoritedAt)}
              </span>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(repo);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  onRemove(repo);
                }
              }}
              className="shrink-0 p-0.5 rounded text-gray-300 dark:text-gray-600
                         hover:text-red-400 dark:hover:text-red-400
                         transition-all duration-150 hover:scale-110 active:scale-95"
              aria-label={t('removeFavorite')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="w-3.5 h-3.5"
              >
                <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
              </svg>
            </div>
          </button>
        );
      })}
    </div>
  );
}
