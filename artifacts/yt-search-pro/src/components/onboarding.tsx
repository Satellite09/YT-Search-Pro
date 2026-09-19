import React from 'react';
import { Button } from '@/components/ui/button';
import { Database, Zap, Lock } from 'lucide-react';

export function Onboarding({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] h-full text-center px-6 w-full max-w-md mx-auto">
      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-primary/20 ring-4 ring-primary/10">
        <Database className="w-8 h-8 text-primary-foreground" />
      </div>
      
      <h1 className="text-3xl font-bold tracking-tight mb-3">YT Search Pro</h1>
      <p className="text-base text-muted-foreground max-w-[320px] mx-auto mb-10 leading-relaxed">
        High-fidelity retrieval for YouTube. Query transcripts, descriptions, and titles across your subscriptions or globally.
      </p>

      <div className="w-full space-y-4 mb-10 text-left">
        <div className="flex gap-4 p-4 rounded-xl bg-card border shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold mb-0.5 text-foreground">Instant Local Index</div>
            <div className="text-sm text-muted-foreground">Lightning fast sub-second search with complete metadata.</div>
          </div>
        </div>
        <div className="flex gap-4 p-4 rounded-xl bg-card border shadow-sm transition-all hover:border-primary/30 hover:shadow-md">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-semibold mb-0.5 text-foreground">Private & Secure</div>
            <div className="text-sm text-muted-foreground">Index runs locally in your browser. No data leaves your machine.</div>
          </div>
        </div>
      </div>

      <Button onClick={onSignIn} className="w-full h-12 text-base font-semibold shadow-lg">
        Connect YouTube Account
      </Button>
      <div className="mt-6 text-xs text-muted-foreground flex items-center gap-1.5">
        <Lock className="w-3 h-3" />
        <span>OAuth 2.0 via Google</span>
      </div>
    </div>
  );
}
