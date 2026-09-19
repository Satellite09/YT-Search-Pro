import React from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
}

export function SearchInput({ value, onChange, onSubmit, isLoading }: SearchInputProps) {
  return (
    <form 
      className="relative flex items-center w-full"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
        <Search className="h-4 w-4" />
      </div>
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Query transcripts, descriptions, titles..."
        className="pl-9 pr-14 h-11 text-base rounded-md border-border bg-background focus-visible:ring-primary font-medium"
      />
      <div className="absolute inset-y-0 right-1 flex items-center">
        <Button 
          type="submit" 
          size="sm" 
          variant="ghost" 
          className="h-8 px-2 text-xs font-semibold uppercase text-primary hover:bg-primary/10 hover:text-primary"
          disabled={isLoading || !value.trim()}
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enter'}
        </Button>
      </div>
    </form>
  );
}
