
'use client';

import React, { useState, type KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SendHorizonal } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSendMessage, disabled = false }: MessageInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t bg-background mb-2"> {/* Added mb-2 here */}
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Type your message..."
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="flex-grow text-base rounded-full shadow-sm focus-visible:ring-primary"
          disabled={disabled}
          aria-label="Message input"
        />
        <Button
          type="button"
          onClick={handleSend}
          className="rounded-full shadow-sm"
          size="icon"
          disabled={disabled || !inputValue.trim()}
          aria-label="Send message"
        >
          <SendHorizonal className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
