import { openUrl } from '@tauri-apps/plugin-opener';
import { useLocale, useT } from '../i18n';
import type { AnalyzedRepo } from '../types';

interface DetailViewProps {
  repo: AnalyzedRepo;
  onBack: () => void;
}

function formatTotalStars(stars: string): string {
  const num = parseInt(stars.replace(/,/g, ''), 10);
  if (Number.isNaN(num)) return stars;
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(num);
}

export function DetailView({ repo, onBack }: DetailViewProps) {
  const { locale } = useLocale();
  const t = useT();
  const summary = repo.summary[locale];

  const handleOpenGithub = () => {
    void openUrl(repo.url);
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
          <h2 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 truncate leading-tight">
            {repo.name}
          </h2>
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
