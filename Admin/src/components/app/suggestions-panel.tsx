// src/components/app/suggestions-panel.tsx
'use client';

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquareQuote, Tag } from 'lucide-react';

interface SuggestionsPanelProps {
  suggestions: string[];
  contextTags: string[];
  onSelectSuggestion: (suggestion: string) => void;
  isLoadingSuggestions: boolean;
}

export const SuggestionsPanel: FC<SuggestionsPanelProps> = ({
  suggestions,
  contextTags,
  onSelectSuggestion,
  isLoadingSuggestions,
}) => {
  return (
    <Card className="h-full flex flex-col rounded-none border-0 border-l">
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-lg flex items-center">
          <MessageSquareQuote className="h-5 w-5 mr-2 text-accent"/>
          PayO Suggestions
        </CardTitle>
      </CardHeader>
      
      {contextTags.length > 0 && (
        <div className="p-4 border-b">
          <h3 className="text-sm font-medium mb-2 flex items-center text-muted-foreground">
            <Tag className="h-4 w-4 mr-1.5" />
            Context Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {contextTags.map((tag, index) => {
              let badgeVariant: "secondary" | "destructive" | "warning" = "secondary";
              const lowerTag = tag.toLowerCase();
              if (lowerTag.startsWith("priority:")) {
                if (lowerTag.includes("urgent")) {
                  badgeVariant = "destructive";
                } else if (lowerTag.includes("non-urgent") || lowerTag.includes("non urgent")) {
                  badgeVariant = "warning";
                }
              }
              return (
                <Badge key={index} variant={badgeVariant} className="text-xs">
                  {tag}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      <ScrollArea className="flex-grow">
        <CardContent className="p-4">
          {isLoadingSuggestions && (
            <div className="flex items-center text-sm text-muted-foreground p-2">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading suggestions...
            </div>
          )}
          {!isLoadingSuggestions && suggestions.length === 0 && (
            <p className="text-sm text-muted-foreground">No suggestions at the moment. Bot will provide ideas as the conversation progresses.</p>
          )}
          {suggestions.length > 0 && (
            <div className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-2.5 px-3 text-sm leading-snug whitespace-normal"
                  onClick={() => onSelectSuggestion(suggestion)}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
};
