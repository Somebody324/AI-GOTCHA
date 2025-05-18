
'use client';

import { Button } from '@/components/ui/button';

interface QuerySuggestionButtonsProps {
  queries: string[];
  onQueryClick: (query: string) => void;
}

export function QuerySuggestionButtons({ queries, onQueryClick }: QuerySuggestionButtonsProps) {
  return (
    <div className="p-4 flex flex-col sm:flex-row flex-wrap justify-center items-center gap-2 border-b bg-background shadow-sm">
      <p className="text-sm text-muted-foreground mr-2 mb-2 sm:mb-0">Select an issue to begin:</p>
      <div className="flex flex-wrap justify-center gap-2">
        {queries.map((query) => (
          <Button
            key={query}
            variant="outline"
            size="sm"
            onClick={() => onQueryClick(query)}
            className="text-sm rounded-full shadow-sm hover:shadow-md transition-shadow"
          >
            {query}
          </Button>
        ))}
      </div>
    </div>
  );
}
