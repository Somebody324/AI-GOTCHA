import type { Message } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Bot, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const isCurrentUser = message.sender.isCurrentUser;

  return (
    <div className={cn('flex items-end gap-2 my-3', isCurrentUser ? 'justify-end' : 'justify-start')}>
      {!isCurrentUser && (
        <Avatar className="w-8 h-8 shadow">
          <AvatarImage src={message.sender.avatarUrl} alt={message.sender.name} data-ai-hint="robot avatar" />
          <AvatarFallback>
            <Bot className="w-5 h-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          'max-w-[70%] p-3 rounded-lg shadow-md break-words',
          isCurrentUser ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-card-foreground rounded-bl-none'
        )}
      >
        <p className="text-sm">{message.content}</p>
        <p className={cn(
            "text-xs mt-1",
            isCurrentUser ? "text-primary-foreground/70 text-right" : "text-muted-foreground text-left"
          )}>
          {format(message.timestamp, 'p')}
        </p>
      </div>
      {isCurrentUser && (
        <Avatar className="w-8 h-8 shadow">
          <AvatarImage src={message.sender.avatarUrl} alt={message.sender.name} data-ai-hint="person avatar" />
          <AvatarFallback>
            <UserIcon className="w-5 h-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
