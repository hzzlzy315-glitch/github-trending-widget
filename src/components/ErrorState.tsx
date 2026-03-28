import { useT } from '../i18n';

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const t = useT();

  const isCliError =
    message.toLowerCase().includes('claude cli') ||
    message.toLowerCase().includes('not found');

  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center flex-1">
      <div className="text-3xl select-none" aria-hidden="true">
        {isCliError ? '🔧' : '⚠️'}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
        {isCliError ? t('noCli') : t('error')}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-1.5 text-sm font-medium rounded-lg
                   bg-gray-900 dark:bg-white text-white dark:text-gray-900
                   hover:bg-gray-800 dark:hover:bg-gray-100
                   active:bg-gray-700 dark:active:bg-gray-200
                   transition-colors duration-150 cursor-default"
      >
        {t('refresh')}
      </button>
    </div>
  );
}
