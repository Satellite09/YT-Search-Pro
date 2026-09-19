import React, { useState, useMemo, useEffect } from 'react';
import { useYTState } from '@/hooks/use-yt-state';
import { Onboarding } from '@/components/onboarding';
import { SearchInput } from '@/components/search/search-input';
import { FilterBar } from '@/components/search/filter-bar';
import { ResultCard } from '@/components/search/result-card';
import { IndexStatusView } from '@/components/search/index-status';
import { SavedSearchesList } from '@/components/search/saved-searches-list';
import { MOCK_VIDEOS } from '@/lib/mock-data';
import { AlertCircle, Settings, Database, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { buildOrResumeIndex, getGoogleToken } from '@/lib/youtube-indexer';

export default function Home() {
  const { state, updateState } = useYTState();
  const [activeQuery, setActiveQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const isInstalledExtension = typeof chrome !== 'undefined' && Boolean(chrome.runtime?.id);

  const handleSignIn = async () => {
    setAuthError(null);
    if (!isInstalledExtension) {
      updateState({ authStatus: 'authenticated' });
      return;
    }

    try {
      const token = await getGoogleToken(true);
      updateState({
        authStatus: 'authenticated',
        indexStatus: {
          phase: 'building',
          indexedChannels: 0,
          totalChannels: 0,
          videoCount: 0,
          updatedAt: new Date().toISOString(),
        },
      });
      void buildOrResumeIndex(token, (checkpoint) => {
        updateState({
          indexStatus: {
            phase: checkpoint.phase === 'complete' ? 'complete' : 'building',
            indexedChannels: checkpoint.indexedChannels,
            totalChannels: checkpoint.totalChannels,
            videoCount: 0,
            updatedAt: checkpoint.updatedAt ?? new Date().toISOString(),
          },
        });
      }).catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Indexing failed';
        if (/auth|token|credential|unauthorized/i.test(message)) {
          updateState({ authStatus: 'expired' });
        } else {
          setAuthError(message);
        }
      });
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Google sign-in failed');
    }
  };
  
  // Simulate index building progression just for visual effect
  useEffect(() => {
    if (state.authStatus !== 'authenticated' || state.indexStatus.phase !== 'building') return;
    const interval = setInterval(() => {
      updateState({
        indexStatus: {
          ...state.indexStatus,
          indexedChannels: Math.min(state.indexStatus.totalChannels, state.indexStatus.indexedChannels + 1),
          videoCount: state.indexStatus.videoCount + Math.floor(Math.random() * 50),
          phase: state.indexStatus.indexedChannels >= state.indexStatus.totalChannels - 1 ? 'complete' : 'building'
        }
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [state.authStatus, state.indexStatus.phase, state.indexStatus.indexedChannels]);

  // Mock search execution
  const handleSearch = () => {
    if (!activeQuery.trim()) return;
    setIsSearching(true);
    // Simulate network/index delay
    setTimeout(() => {
      setIsSearching(false);
      setHasSearched(true);
    }, 350);
  };

  // Memoized fake results based on state
  const results = useMemo(() => {
    if (!hasSearched) return [];
    
    let filtered = MOCK_VIDEOS.filter(v => 
      v.title.toLowerCase().includes(activeQuery.toLowerCase()) ||
      v.channelTitle.toLowerCase().includes(activeQuery.toLowerCase()) ||
      v.description.toLowerCase().includes(activeQuery.toLowerCase())
    );

    if (state.selectedCountries.length > 0) {
      filtered = filtered.filter(v => state.selectedCountries.includes(v.country));
    }
    
    return filtered;
  }, [hasSearched, activeQuery, state.selectedCountries, state.datePreset]);

  const handleSaveSearch = () => {
    const newSearch = {
      id: Math.random().toString(36).slice(2, 9),
      name: activeQuery || 'Global Query',
      query: activeQuery,
      scope: state.scope,
      dateWindow: state.datePreset,
      countries: state.selectedCountries,
      createdAt: new Date().toISOString()
    };
    updateState({ savedSearches: [newSearch, ...state.savedSearches] });
  };

  const handleApplySavedSearch = (s: any) => {
    setActiveQuery(s.query);
    updateState({
      scope: s.scope,
      datePreset: s.dateWindow,
      selectedCountries: s.countries
    });
    // Auto trigger search
    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setHasSearched(true);
    }, 200);
  };

  const handleDeleteSavedSearch = (id: string) => {
    updateState({ savedSearches: state.savedSearches.filter(s => s.id !== id) });
  };

  // Rendering States
  if (state.authStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div>
          <Onboarding onSignIn={handleSignIn} />
          {authError && (
            <p role="alert" className="mx-auto -mt-6 max-w-md px-6 text-center text-sm text-destructive">
              {authError} Check the extension's Google OAuth configuration, then try again.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (state.authStatus === 'expired') {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center">
        <ServerCrash className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold mb-2">Session Expired</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Your YouTube API token has expired. Please re-authenticate to continue searching.
        </p>
        <Button onClick={handleSignIn}>
          Reconnect Account
        </Button>
      </div>
    );
  }

  return (
    <div className={`min-h-[100dvh] bg-background text-foreground flex flex-col font-sans max-w-5xl mx-auto md:border-x border-border/50 shadow-2xl relative transition-all ${state.uiPreferences.compactMode ? 'max-w-3xl' : ''}`}>
      {/* Header */}
      <header className="h-14 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-40 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2 text-primary font-bold tracking-tight">
          <Database className="w-5 h-5" />
          <span>YT Search Pro</span>
        </div>
        
        <div className="flex items-center gap-3">
          {state.quotaStatus === 'exhausted' && (
            <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded-md font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              Quota Exhausted
            </div>
          )}
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Settings className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-4 space-y-5">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-foreground">Preferences</h4>
                <p className="text-xs text-muted-foreground">Adjust your experience.</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Compact Mode</span>
                  <Switch 
                    checked={state.uiPreferences.compactMode}
                    onCheckedChange={(c) => updateState({ uiPreferences: { ...state.uiPreferences, compactMode: c } })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Theme</span>
                  <select 
                    className="text-sm bg-muted text-foreground rounded-md px-2 py-1 outline-none border focus:ring-1 focus:ring-primary"
                    value={state.uiPreferences.theme}
                    onChange={(e) => updateState({ uiPreferences: { ...state.uiPreferences, theme: e.target.value as any } })}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full"
                  onClick={() => updateState({ authStatus: 'unauthenticated' })}
                >
                  Sign Out
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Sidebar */}
        <aside className={`w-full shrink-0 border-b md:border-b-0 md:border-r bg-muted/20 p-4 flex flex-col gap-6 overflow-y-auto ${state.uiPreferences.compactMode ? 'md:w-[240px]' : 'md:w-[300px]'}`}>
          <IndexStatusView status={state.indexStatus} />
          
          <div className="space-y-2">
            <SavedSearchesList 
              searches={state.savedSearches}
              onSelect={handleApplySavedSearch}
              onDelete={handleDeleteSavedSearch}
            />
          </div>
        </aside>

        {/* Main Search Panel */}
        <main className="flex-1 flex flex-col min-w-0 bg-background relative">
          <div className="p-4 border-b space-y-4 sticky top-0 bg-background/95 backdrop-blur-sm z-30 shadow-sm">
            <SearchInput 
              value={activeQuery}
              onChange={setActiveQuery}
              onSubmit={handleSearch}
              isLoading={isSearching}
            />
            
            <FilterBar 
              scope={state.scope}
              onScopeChange={(s) => updateState({ scope: s })}
              datePreset={state.datePreset}
              onDatePresetChange={(d) => updateState({ datePreset: d })}
              selectedCountries={state.selectedCountries}
              onCountriesChange={(c) => updateState({ selectedCountries: c })}
              onSaveSearch={handleSaveSearch}
            />
          </div>
          
          {/* Results Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-muted/5">
            {!hasSearched ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-60 p-8">
                <Database className="w-12 h-12 mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-1">Index Ready for Search</h3>
                <p className="text-sm text-muted-foreground max-w-[300px]">
                  Search across {new Intl.NumberFormat().format(state.indexStatus.videoCount)} indexed videos instantly. Use the bar above to start.
                </p>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-3 pb-8">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-1">
                  <span>{results.length} {results.length === 1 ? 'Result' : 'Results'} Found</span>
                  <span>{Math.floor(Math.random() * 100) + 12}ms</span>
                </div>
                {results.map(video => (
                  <ResultCard key={video.id} video={video} />
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <AlertCircle className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">No matches found</h3>
                <p className="text-sm text-muted-foreground max-w-[300px]">
                  Try adjusting your filters or expanding your search scope globally.
                </p>
                <Button variant="outline" size="sm" className="mt-6 font-semibold" onClick={() => {
                  setActiveQuery('');
                  updateState({ datePreset: 'any', selectedCountries: [] });
                  setHasSearched(false);
                }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
