export interface RepoSummary {
  what_is_it: string;
  how_to_use: string;
  why_it_helps: string;
}

export interface LocalizedSummary {
  zh: RepoSummary;
  en: RepoSummary;
}

export interface AnalyzedRepo {
  rank: number;
  owner: string;
  name: string;
  url: string;
  description: string;
  language: string | null;
  stars: string;
  weekly_stars: string;
  category: string;
  summary: LocalizedSummary;
}

export interface FavoriteRepo {
  repo: AnalyzedRepo;
  favoritedAt: string; // ISO date string
}

export type Locale = 'zh' | 'en';
