
// src/components/app/message-input-area.tsx
'use client';

import React, { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { SendHorizontal, Loader2 } from 'lucide-react';

interface MessageInputAreaProps {
  currentMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: (message: string) => void;
  suggestions: string[];
  onSuggestionSelect: (suggestion: string) => void;
  isLoadingSuggestions: boolean; // For bot suggestions loading state
  isSendingAgentMessage?: boolean; // For agent message sending state
}

export function MessageInputArea({
  currentMessage,
  onMessageChange,
  onSendMessage,
  suggestions,
  onSuggestionSelect,
  isLoadingSuggestions,
  isSendingAgentMessage, 
}: MessageInputAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSendingAgentMessage) { // Prevent submission if already sending
        onSendMessage(currentMessage);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onSuggestionSelect(suggestion); 
    inputRef.current?.focus();
  };

  const isInputDisabled = isLoadingSuggestions || isSendingAgentMessage;

  return (
    <div className="bg-card border-t border-border p-4 shadow- ऊपर">
      {(isLoadingSuggestions && !suggestions.length && !isSendingAgentMessage) && ( // Only show suggestion loader if not sending message
         <ScrollArea className="w-full whitespace-nowrap mb-3">
          <div className="flex space-x-2 pb-2">
            {isLoadingSuggestions && (
              <div className="flex items-center text-sm text-muted-foreground p-2">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading suggestions...
              </div>
            )}
            {/* Suggestions buttons are not shown here as per previous setup if suggestions are in a separate panel */}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Type your message..."
          value={currentMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          className="flex-grow"
          aria-label="Message input"
          disabled={!!isInputDisabled} 
        />
        <Button 
          type="submit" 
          size="icon" 
          aria-label="Send message" 
          disabled={!currentMessage.trim() || !!isInputDisabled}
        >
          {isSendingAgentMessage ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizontal className="h-5 w-5" />}
        </Button>
      </form>
    </div>
  );
}

    