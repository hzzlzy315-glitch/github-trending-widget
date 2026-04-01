import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { LocaleProvider } from './i18n';
import { Header } from './components/Header';
import { TrendingItem } from './components/TrendingItem';
import { FavoritesView } from './components/FavoritesView';
import { Skeleton } from './components/Skeleton';
import { ErrorState } from './components/ErrorState';
import { DetailView } from './components/DetailView';
import { loadFavorites, addFavorite, removeFavorite, isFavorited } from './favorites';
import type { AnalyzedRepo, FavoriteRepo } from './types';

const CACHE_KEY = 'github_trending_cache';

interface CacheData {
  repos: AnalyzedRepo[];
  fetchedAt: string;
}

function loadCache(): CacheData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: CacheData = JSON.parse(raw);
    if (cache.repos && cache.repos.length > 0) {
      return cache;
    }
  } catch {
    // corrupted cache
  }
  return null;
}

function saveCache(repos: AnalyzedRepo[]): void {
  try {
    const data: CacheData = {
      repos,
      fetchedAt: new Date().toISOString(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable
  }
}

function AppContent() {
  const cached = useRef(loadCache());
  const [repos, setRepos] = useState<AnalyzedRepo[]>(cached.current?.repos ?? []);
  const [fetchedAt, setFetchedAt] = useState<string | null>(cached.current?.fetchedAt ?? null);
  const [selectedRepo, setSelectedRepo] = useState<AnalyzedRepo | null>(null);
  const [loading, setLoading] = useState(!cached.current);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'trending' | 'favorites'>('trending');
  const [favorites, setFavorites] = useState<FavoriteRepo[]>(loadFavorites());

  const fetchRepos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await invoke<AnalyzedRepo[]>('fetch_trending_repos');
      setRepos(data);
      const now = new Date().toISOString();
      setFetchedAt(now);
      saveCache(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Only auto-fetch if there's no cache
  useEffect(() => {
    if (!cached.current) {
      void fetchRepos();
    }
  }, [fetchRepos]);

  const handleBack = useCallback(() => {
    setSelectedRepo(null);
  }, []);

  const handleToggleFavorite = useCallback((repo: AnalyzedRepo) => {
    if (isFavorited(favorites, repo)) {
      const updated = removeFavorite(repo.name, repo.owner);
      setFavorites(updated);
    } else {
      const updated = addFavorite(repo);
      setFavorites(updated);
    }
  }, [favorites]);

  const handleToggleView = useCallback(() => {
    setView((prev) => (prev === 'trending' ? 'favorites' : 'trending'));
    setSelectedRepo(null);
  }, []);

  if (selectedRepo) {
    return (
      <div className="flex flex-col h-screen">
        <DetailView
          repo={selectedRepo}
          onBack={handleBack}
          isFavorited={isFavorited(favorites, selectedRepo)}
          onToggleFavorite={handleToggleFavorite}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header
        loading={loading}
        onRefresh={fetchRepos}
        view={view}
        onToggleView={handleToggleView}
        fetchedAt={fetchedAt}
      />
      <div className="flex-1 overflow-y-auto py-1">
        {view === 'favorites' ? (
          <FavoritesView
            favorites={favorites}
            onSelect={setSelectedRepo}
            onRemove={handleToggleFavorite}
          />
        ) : (
          <>
            {loading && repos.length === 0 && <Skeleton />}
            {!loading && error && repos.length === 0 && (
              <ErrorState message={error} onRetry={fetchRepos} />
            )}
            {repos.length > 0 && (
              <div className="flex flex-col">
                {repos.map((repo) => (
                  <TrendingItem
                    key={`${repo.owner}/${repo.name}`}
                    repo={repo}
                    onSelect={setSelectedRepo}
                    isFavorited={isFavorited(favorites, repo)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <LocaleProvider>
      <AppContent />
    </LocaleProvider>
  );
}
