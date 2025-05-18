// src/components/app/header.tsx
import { Bot } from 'lucide-react';
import React from 'react';

export function Header() {
  return (
    <header className="bg-card p-4 shadow-md sticky top-0 z-50 border-b">
      <div className="container mx-auto flex items-center">
        <Bot className="h-8 w-8 mr-3 text-accent" />
        <h1 className="text-xl font-semibold text-foreground">
          AI·GOTCHA AGENT SUPPORT
        </h1>
      </div>
    </header>
  );
}
