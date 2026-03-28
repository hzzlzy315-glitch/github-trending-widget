import type { AnalyzedRepo, FavoriteRepo } from './types';

const FAVORITES_KEY = 'github_trending_favorites';

export function loadFavorites(): FavoriteRepo[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed: FavoriteRepo[] = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // corrupted data
  }
  return [];
}

export function saveFavorites(favorites: FavoriteRepo[]): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch {
    // localStorage full or unavailable
  }
}

export function addFavorite(repo: AnalyzedRepo): FavoriteRepo[] {
  const current = loadFavorites();
  const entry: FavoriteRepo = {
    repo,
    favoritedAt: new Date().toISOString(),
  };
  const updated = [entry, ...current.filter(
    (f) => !(f.repo.owner === repo.owner && f.repo.name === repo.name),
  )];
  saveFavorites(updated);
  return updated;
}

export function removeFavorite(repoName: string, repoOwner: string): FavoriteRepo[] {
  const current = loadFavorites();
  const updated = current.filter(
    (f) => !(f.repo.owner === repoOwner && f.repo.name === repoName),
  );
  saveFavorites(updated);
  return updated;
}

export function isFavorited(favorites: FavoriteRepo[], repo: AnalyzedRepo): boolean {
  return favorites.some(
    (f) => f.repo.owner === repo.owner && f.repo.name === repo.name,
  );
}
