import { openUrl } from '@tauri-apps/plugin-opener';
import { useLocale, useT } from '../i18n';
import type { AnalyzedRepo } from '../types';

interface DetailViewProps {
  repo: AnalyzedRepo;
  onBack: () => void;
  isFavorited: boolean;
  onToggleFavorite: (repo: AnalyzedRepo) => void;
}

function formatTotalStars(stars: string): string {
  const num = parseInt(stars.replace(/,/g, ''), 10);
  if (Number.isNaN(num)) return stars;
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

export function DetailView({ repo, onBack, isFavorited, onToggleFavorite }: DetailViewProps) {
  const { locale } = useLocale();
  const t = useT();
  const summary = repo.summary[locale];

  const handleOpenGithub = () => {
    void openUrl(repo.url);
  };

  const handleFavoriteClick = () => {
    onToggleFavorite(repo);
  };

  return (
    <div className="flex flex-col h-full animate-slide-in">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-2 shrink-0" data-tauri-drag-region>
        <button
          type="button"
          onClick={onBack}
          className="p-1 -ml-1 rounded-lg text-gray-400 dark:text-gray-500
                     hover:bg-black/5 dark:hover:bg-white/10
                     transition-colors duration-150 cursor-default"
          aria-label={t('back')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="w-3.5 h-3.5"
          >
            <path
              fillRule="evenodd"
              d="M14 8a.75.75 0 0 1-.75.75H4.56l3.22 3.22a.75.75 0 1 1-1.06 1.06l-4.5-4.5a.75.75 0 0 1 0-1.06l4.5-4.5a.75.75 0 0 1 1.06 1.06L4.56 7.25h8.69A.75.75 0 0 1 14 8Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <div className="min-w-0 flex-1" data-tauri-drag-region>
          <div className="flex items-center gap-1.5">
            <h2 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 truncate leading-tight">
              {repo.name}
            </h2>
            <button
              type="button"
              onClick={handleFavoriteClick}
              className={`shrink-0 p-0.5 rounded transition-all duration-150
                          hover:scale-110 active:scale-95
                          ${isFavorited
                            ? 'text-red-400 dark:text-red-400'
                            : 'text-gray-300 dark:text-gray-600 hover:text-gray-400 dark:hover:text-gray-500'}`}
              aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <HeartIcon filled={isFavorited} />
            </button>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight mt-0.5">
            {repo.owner} · ★ {formatTotalStars(repo.stars)}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Badges */}
        <div className="flex items-center gap-1.5 mb-4">
          {repo.language && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full
                             bg-blue-500/8 dark:bg-blue-400/10
                             text-blue-600 dark:text-blue-400">
              {repo.language}
            </span>
          )}
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full
                           bg-purple-500/8 dark:bg-purple-400/10
                           text-purple-600 dark:text-purple-400">
            {repo.category}
          </span>
        </div>

        {/* Summary sections */}
        <div className="flex flex-col gap-4">
          <SummarySection title={t('whatIsIt')} content={summary.what_is_it} />
          <SummarySection title={t('howToUse')} content={summary.how_to_use} />
          <SummarySection title={t('whyItHelps')} content={summary.why_it_helps} />
        </div>

        {/* Open on GitHub button */}
        <button
          type="button"
          onClick={handleOpenGithub}
          className="mt-5 w-full py-2 text-[12px] font-medium rounded-xl
                     bg-black/[0.06] dark:bg-white/[0.08]
                     text-gray-600 dark:text-gray-300
                     hover:bg-black/[0.1] dark:hover:bg-white/[0.12]
                     active:bg-black/[0.14] dark:active:bg-white/[0.16]
                     transition-colors duration-150 cursor-default"
        >
          {t('openGithub')} ↗
        </button>
      </div>
    </div>
  );
}

function SummarySection({ title, content }: { title: string; content: string }) {
  return (
    <section>
      <h3 className="text-[10px] font-semibold text-gray-400 dark:text-gray-500
                      uppercase tracking-wider mb-1">
        {title}
      </h3>
      <p className="text-[13px] text-gray-700 dark:text-gray-300 leading-relaxed">
        {content}
      </p>
    </section>
  );
}
