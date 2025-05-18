// src/components/app/message-bubble.tsx
'use client';

import { cn } from '@/lib/utils';
import React from 'react';
import type { Message } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface MessageBubbleProps {
  message: Message;
  onDeleteMessage?: (messageId: string) => void;
}

export function MessageBubble({ message, onDeleteMessage }: MessageBubbleProps) {
  // 'user' (app user, acting as agent) on RIGHT, 'agent' (customer/other party) on LEFT
  const isAppUser = message.sender === 'user';

  return (
    <div
      className={cn(
        'flex group animate-bubble-appear mb-4',
        isAppUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-xs lg:max-w-md px-4 py-3 rounded-xl shadow-md relative',
          isAppUser
            ? 'bg-primary text-primary-foreground rounded-br-none' // App user (agent) style
            : 'bg-secondary text-secondary-foreground rounded-bl-none border' // Other party (customer) style
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        <p
          className={cn(
            'text-xs mt-1',
            isAppUser ? 'text-primary-foreground/80 text-right' : 'text-secondary-foreground/80 text-left'
          )}
        >
          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
        {isAppUser && onDeleteMessage && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary/80"
            onClick={() => onDeleteMessage(message.id)}
            aria-label="Delete message"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
