import { useState, useEffect, useCallback } from 'react';
import { AppState } from '@/lib/types';
import { MOCK_INDEX_STATUS } from '@/lib/mock-data';

const DEFAULT_STATE: AppState = {
  authStatus: 'unauthenticated',
  quotaStatus: 'ok',
  indexStatus: MOCK_INDEX_STATUS,
  
  searchQuery: '',
  scope: 'subscriptions',
  datePreset: 'any',
  customDateRange: null,
  selectedCountries: [],
  
  savedSearches: [],
  uiPreferences: {
    theme: 'system',
    compactMode: false,
  }
};

export function useYTState() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('yt-search-pro-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_STATE, ...parsed, indexStatus: MOCK_INDEX_STATUS };
      } catch (e) {}
    }
    return DEFAULT_STATE;
  });

  useEffect(() => {
    const toSave = { ...state };
    toSave.searchQuery = ''; // Don't persist active query
    localStorage.setItem('yt-search-pro-state', JSON.stringify(toSave));
  }, [state]);

  useEffect(() => {
    const isDark = state.uiPreferences.theme === 'dark' || 
      (state.uiPreferences.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.uiPreferences.theme]);

  const updateState = useCallback((updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  return { state, updateState };
}
