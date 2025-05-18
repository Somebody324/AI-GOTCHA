interface TypingIndicatorProps {
  isTyping: boolean;
  typerName: string;
}

export function TypingIndicator({ isTyping, typerName }: TypingIndicatorProps) {
  if (!isTyping) return null;

  return (
    <div className="px-4 pb-2 text-sm text-muted-foreground animate-pulse">
      {typerName} is typing...
    </div>
  );
}
