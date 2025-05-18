// src/components/app/ticket-list.tsx
'use client';

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  lastMessage: string;
}

interface TicketListProps {
  tickets: Ticket[];
  selectedTicketId: string | null;
  onSelectTicket: (ticketId: string) => void;
  disabled?: boolean; // Added disabled prop
}

export const TicketList: FC<TicketListProps> = ({ tickets, selectedTicketId, onSelectTicket, disabled = false }) => {
  return (
    <Card className="h-full flex flex-col rounded-none border-0 border-r">
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-lg">Tickets</CardTitle>
      </CardHeader>
      <ScrollArea className="flex-grow">
        <CardContent className="p-0">
          {disabled ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              <AlertTriangle className="mx-auto h-8 w-8 text-destructive mb-2" />
              <p className="font-semibold text-destructive">Firebase Not Connected</p>
              <p>Ticket functionality is disabled. Please check your <code>.env</code> configuration.</p>
            </div>
          ) : tickets.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No tickets available or loaded from Firebase.</p>
          ) : (
            <div className="space-y-0">
              {tickets.map((ticket) => (
                <Button
                  key={ticket.id}
                  variant="ghost"
                  disabled={disabled}
                  className={cn(
                    'w-full h-auto justify-start text-left p-4 rounded-none border-b focus-visible:ring-inset',
                    'hover:bg-accent/80 hover:text-accent-foreground',
                    selectedTicketId === ticket.id && 'bg-accent text-accent-foreground',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                  onClick={() => !disabled && onSelectTicket(ticket.id)}
                >
                  <div>
                    <p className="font-semibold text-sm">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-full">{ticket.lastMessage}</p>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
};
