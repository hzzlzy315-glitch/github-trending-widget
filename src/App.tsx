import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { LocaleProvider } from './i18n';
import { Header } from './components/Header';
import { TrendingItem } from './components/TrendingItem';
import { Skeleton } from './components/Skeleton';
import { ErrorState } from './components/ErrorState';
import { DetailView } from './components/DetailView';
import type { AnalyzedRepo } from './types';

const CACHE_KEY = 'github_trending_cache';

interface CacheData {
  repos: AnalyzedRepo[];
  fetchedAt: string;
}

function loadCache(): AnalyzedRepo[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: CacheData = JSON.parse(raw);
    if (cache.repos && cache.repos.length > 0) {
      return cache.repos;
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
  const [repos, setRepos] = useState<AnalyzedRepo[]>(cached.current ?? []);
  const [selectedRepo, setSelectedRepo] = useState<AnalyzedRepo | null>(null);
  const [loading, setLoading] = useState(!cached.current);
  const [error, setError] = useState<string | null>(null);

  const fetchRepos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await invoke<AnalyzedRepo[]>('fetch_trending_repos');
      setRepos(data);
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

  if (selectedRepo) {
    return (
      <div className="flex flex-col h-screen">
        <DetailView repo={selectedRepo} onBack={handleBack} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header loading={loading} onRefresh={fetchRepos} />
      <div className="flex-1 overflow-y-auto py-1">
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
              />
            ))}
          </div>
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
