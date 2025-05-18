
import type React from 'react';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import type { Message, User } from '@/types/chat';

interface ChatLayoutProps {
  messages: Message[];
  currentUser: User;
  onSendMessage: (content: string) => void;
  isInputDisabled?: boolean; // New prop
}

export function ChatLayout({
  messages,
  currentUser,
  onSendMessage,
  isInputDisabled, // Destructure
}: ChatLayoutProps) {
  return (
    <div className="flex flex-col flex-grow overflow-hidden">
      <MessageList messages={messages} />
      <MessageInput
        onSendMessage={onSendMessage}
        disabled={isInputDisabled} // Pass down to MessageInput
      />
    </div>
  );
}
