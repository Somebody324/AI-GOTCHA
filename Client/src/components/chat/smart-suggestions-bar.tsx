import { Button } from '@/components/ui/button';
import { Lightbulb } from 'lucide-react';

interface SmartSuggestionsBarProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  isLoading: boolean;
}

export function SmartSuggestionsBar({ suggestions, onSuggestionClick, isLoading }: SmartSuggestionsBarProps) {
  if (isLoading) {
    return (
      <div className="px-4 py-2 border-t text-sm text-muted-foreground flex items-center gap-2">
        <Lightbulb className="w-4 h-4 animate-pulse" />
        <span>Loading suggestions...</span>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="px-4 py-2 border-t">
      <div className="flex items-center mb-2">
        <Lightbulb className="w-4 h-4 mr-2 text-accent-foreground" />
        <span className="text-sm font-medium text-accent-foreground">Smart Suggestions:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="text-accent-foreground border-accent hover:bg-accent/10 hover:text-accent-foreground"
            onClick={() => onSuggestionClick(suggestion)}
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
}
