import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { createElement } from 'react';
import type { Locale } from './types';

const translations = {
  zh: {
    title: 'GitHub 每周热榜',
    updated: '更新于',
    refresh: '刷新',
    loading: '加载中...',
    error: '获取失败，请重试',
    noCli: '未找到 Claude Code，请先安装 claude CLI',
    category: '分类',
    whatIsIt: '这是什么',
    howToUse: '怎么用',
    whyItHelps: '对你有什么帮助',
    openGithub: '在 GitHub 中打开',
    back: '返回',
    favorites: '我的收藏',
    noFavorites: '还没有收藏',
    removeFavorite: '取消收藏',
  },
  en: {
    title: 'GitHub Weekly Hot 10',
    updated: 'Updated',
    refresh: 'Refresh',
    loading: 'Loading...',
    error: 'Failed to fetch, please retry',
    noCli: 'Claude Code not found. Please install the claude CLI',
    category: 'Category',
    whatIsIt: 'What is it',
    howToUse: 'How to use',
    whyItHelps: 'Why it helps you',
    openGithub: 'Open on GitHub',
    back: 'Back',
    favorites: 'My Favorites',
    noFavorites: 'No favorites yet',
    removeFavorite: 'Remove',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

interface LocaleContextValue {
  locale: Locale;
  toggleLocale: () => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem('locale');
    if (stored === 'zh' || stored === 'en') {
      return stored;
    }
  } catch {
    // localStorage may be unavailable
  }
  return 'zh';
}

interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);

  const toggleLocale = useCallback(() => {
    setLocale((prev) => {
      const next = prev === 'zh' ? 'en' : 'zh';
      try {
        localStorage.setItem('locale', next);
      } catch {
        // localStorage may be unavailable
      }
      return next;
    });
  }, []);

  return createElement(
    LocaleContext.Provider,
    { value: { locale, toggleLocale } },
    children,
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return ctx;
}

export function useT(): (key: TranslationKey) => string {
  const { locale } = useLocale();
  return useCallback(
    (key: TranslationKey) => translations[locale][key],
    [locale],
  );
}
