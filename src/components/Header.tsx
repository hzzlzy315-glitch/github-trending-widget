import { useLocale, useT } from '../i18n';

interface HeaderProps {
  loading: boolean;
  onRefresh: () => void;
  view: 'trending' | 'favorites';
  onToggleView: () => void;
}

export function Header({ loading, onRefresh, view, onToggleView }: HeaderProps) {
  const { locale, toggleLocale } = useLocale();
  const t = useT();

  return (
    <header
      className="flex items-center justify-between px-4 pt-3 pb-2 select-none shrink-0"
      data-tauri-drag-region
    >
      {/* Left: title */}
      <h1
        className="text-xs font-medium text-gray-500 dark:text-gray-400 pointer-events-none tracking-wide"
        data-tauri-drag-region
      >
        {view === 'favorites' ? t('favorites') : t('title')}
      </h1>

      {/* Right: lang toggle + favorites toggle + refresh */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={toggleLocale}
          className="px-1.5 py-0.5 text-[10px] font-medium rounded-md
                     text-gray-500 dark:text-gray-400
                     hover:bg-black/5 dark:hover:bg-white/10
                     transition-colors duration-150 cursor-default"
          aria-label={locale === 'zh' ? 'Switch to English' : '切换到中文'}
        >
          {locale === 'zh' ? 'EN' : '中'}
        </button>

        <button
          type="button"
          onClick={onToggleView}
          className={`p-1 rounded-md transition-colors duration-150 cursor-default
                      ${view === 'favorites'
                        ? 'text-amber-500 dark:text-amber-400'
                        : 'text-gray-400 dark:text-gray-500 hover:bg-black/5 dark:hover:bg-white/10'}`}
          aria-label={view === 'favorites' ? 'Show trending' : 'Show favorites'}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="w-3 h-3"
          >
            {view === 'favorites' ? (
              <path
                fillRule="evenodd"
                d="M8 1.75a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 13.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 7.874a.75.75 0 0 1 .416-1.28l4.21-.611L7.327 2.17A.75.75 0 0 1 8 1.75Z"
                clipRule="evenodd"
              />
            ) : (
              <path d="M8 1.75a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 13.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 7.874a.75.75 0 0 1 .416-1.28l4.21-.611L7.327 2.17A.75.75 0 0 1 8 1.75Zm0 2.445L6.615 6.93a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 4.195Z" />
            )}
          </svg>
        </button>

        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="p-1 rounded-md text-gray-400 dark:text-gray-500
                     hover:bg-black/5 dark:hover:bg-white/10
                     transition-colors duration-150 disabled:opacity-30 cursor-default"
          aria-label={t('refresh')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`}
          >
            <path d="M13.836 2.477a.75.75 0 0 1 .75.75v3.182a.75.75 0 0 1-.75.75h-3.182a.75.75 0 0 1 0-1.5h1.37l-.84-.841a4.5 4.5 0 0 0-7.08.932.75.75 0 0 1-1.3-.75 6 6 0 0 1 9.44-1.242l.842.84V3.227a.75.75 0 0 1 .75-.75Zm-.911 7.5A.75.75 0 0 1 13.199 11a6 6 0 0 1-9.44 1.241l-.84-.84v1.371a.75.75 0 0 1-1.5 0V9.591a.75.75 0 0 1 .75-.75H5.35a.75.75 0 0 1 0 1.5H3.98l.841.841a4.5 4.5 0 0 0 7.08-.932.75.75 0 0 1 1.025-.273Z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
