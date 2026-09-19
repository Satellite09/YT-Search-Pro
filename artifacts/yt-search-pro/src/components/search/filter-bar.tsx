import React from 'react';
import { DatePreset, Scope, Country } from '@/lib/types';
import { COUNTRY_LABELS } from '@/lib/mock-data';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, Globe2, Save, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FilterBarProps {
  scope: Scope;
  onScopeChange: (scope: Scope) => void;
  
  datePreset: DatePreset;
  onDatePresetChange: (preset: DatePreset) => void;
  
  selectedCountries: Country[];
  onCountriesChange: (countries: Country[]) => void;
  
  onSaveSearch: () => void;
}

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'any', label: 'Any time' },
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
  { value: 'this_year', label: 'This year' }
];

export function FilterBar({
  scope, onScopeChange,
  datePreset, onDatePresetChange,
  selectedCountries, onCountriesChange,
  onSaveSearch
}: FilterBarProps) {
  
  const handleCountryToggle = (country: Country) => {
    if (selectedCountries.includes(country)) {
      onCountriesChange(selectedCountries.filter(c => c !== country));
    } else {
      onCountriesChange([...selectedCountries, country]);
    }
  };

  const hasActiveFilters = datePreset !== 'any' || selectedCountries.length > 0;

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center justify-between w-full">
        
        {/* Scope Switch */}
        <div className="flex items-center gap-3 bg-muted/50 p-1.5 rounded-lg border">
          <span className={`text-xs font-semibold px-2 ${scope === 'subscriptions' ? 'text-foreground' : 'text-muted-foreground'}`}>Subs</span>
          <Switch 
            checked={scope === 'global'} 
            onCheckedChange={(c) => onScopeChange(c ? 'global' : 'subscriptions')}
          />
          <span className={`text-xs font-semibold px-2 ${scope === 'global' ? 'text-primary' : 'text-muted-foreground'}`}>Global</span>
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-2">
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 border-dashed text-xs gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                {DATE_PRESETS.find(p => p.value === datePreset)?.label || 'Date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="start">
              <div className="space-y-1">
                {DATE_PRESETS.map(preset => (
                  <button
                    key={preset.value}
                    onClick={() => onDatePresetChange(preset.value)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      datePreset === preset.value 
                        ? 'bg-primary/10 text-primary font-semibold' 
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 border-dashed text-xs gap-1.5">
                <Globe2 className="w-3.5 h-3.5 text-muted-foreground" />
                Region {selectedCountries.length > 0 && `(${selectedCountries.length})`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="start">
              <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                {(Object.entries(COUNTRY_LABELS) as [Country, string][]).map(([code, label]) => {
                  const isSelected = selectedCountries.includes(code);
                  return (
                    <button
                      key={code}
                      onClick={() => handleCountryToggle(code)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                        isSelected 
                          ? 'bg-primary/10 text-primary font-semibold' 
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <span>{label}</span>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          <div className="w-px h-4 bg-border mx-1"></div>
          
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-primary" onClick={onSaveSearch}>
            <Save className="w-3.5 h-3.5" />
            Save
          </Button>

        </div>
      </div>

      {/* Active Filter Tokens */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5">
          {datePreset !== 'any' && (
            <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-[10px] font-medium rounded-sm">
              <Calendar className="w-3 h-3" />
              {DATE_PRESETS.find(p => p.value === datePreset)?.label}
              <button onClick={() => onDatePresetChange('any')} className="ml-1 hover:text-destructive text-muted-foreground">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          {selectedCountries.map(country => (
            <Badge key={country} variant="secondary" className="gap-1 px-2 py-0.5 text-[10px] font-medium rounded-sm border-border border">
              <Globe2 className="w-3 h-3" />
              {COUNTRY_LABELS[country]}
              <button onClick={() => handleCountryToggle(country)} className="ml-1 hover:text-destructive text-muted-foreground">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
