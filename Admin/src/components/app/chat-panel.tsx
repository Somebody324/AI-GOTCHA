// src/components/app/chat-panel.tsx
'use client';

import React from 'react';
import type { Message } from '@/types/chat';
import { Header } from './header';
import { ConversationArea } from './conversation-area';
import { MessageInputArea } from './message-input-area';

interface ChatPanelProps {
  messages: Message[];
  currentInputValue: string;
  onInputValueChange: (value: string) => void;
  onSendMessage: (text: string) => void;
  isSendingMessage?: boolean;
  onDeleteMessage?: (messageId: string) => void;
}

export function ChatPanel({
  messages,
  currentInputValue,
  onInputValueChange,
  onSendMessage,
  isSendingMessage,
  onDeleteMessage,
}: ChatPanelProps) {
  return (
    <div className="flex flex-col h-full bg-background text-foreground font-sans border-0">
      <Header />
      <ConversationArea messages={messages} onDeleteMessage={onDeleteMessage} />
      <MessageInputArea
        currentMessage={currentInputValue}
        onMessageChange={onInputValueChange}
        onSendMessage={onSendMessage}
        suggestions={[]} 
        onSuggestionSelect={() => {}} 
        isLoadingSuggestions={false}
        isSendingAgentMessage={isSendingMessage}
      />
    </div>
  );
}
