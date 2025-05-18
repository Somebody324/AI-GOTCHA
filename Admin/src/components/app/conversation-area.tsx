// src/components/app/conversation-area.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import type { Message } from '@/types/chat';
import { MessageBubble } from './message-bubble';

interface ConversationAreaProps {
  messages: Message[];
  onDeleteMessage?: (messageId: string) => void;
}

export function ConversationArea({ messages, onDeleteMessage }: ConversationAreaProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={scrollAreaRef} className="flex-grow overflow-y-auto p-4 space-y-2 bg-background">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} onDeleteMessage={onDeleteMessage} />
      ))}
    </div>
  );
}
