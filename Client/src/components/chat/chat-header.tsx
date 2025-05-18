
import { Logo } from '@/components/icons/logo';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2, FilePlus2, ChevronDown, List, LogOut } from 'lucide-react';

interface ChatHeaderProps {
  onDeleteChat: () => void;
  onNewTicket: () => void;
  onEndChat: () => void; // New prop
  allTicketIds: string[];
  isLoadingTickets: boolean;
  currentTicketId: string | null;
  onSelectTicket: (ticketId: string) => void;
}

export function ChatHeader({
  onDeleteChat,
  onNewTicket,
  onEndChat, // Destructure new prop
  allTicketIds,
  isLoadingTickets,
  currentTicketId,
  onSelectTicket
}: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between p-4 border-b shadow-sm bg-background">
      <div className="flex items-center gap-2">
        <Logo className="w-8 h-8 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">AI·GOTCHA</h1>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <DropdownMenu>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1">
                    <List className="w-4 h-4 text-muted-foreground" />
                    <span className="hidden sm:inline">Tickets</span>
                    <ChevronDown className="w-4 h-4 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>View & Switch Tickets</p>
                {currentTicketId && <p className="text-xs text-muted-foreground">Current: {currentTicketId}</p>}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent className="w-64 max-h-96 overflow-y-auto"> {/* Added max-h and overflow */}
            <DropdownMenuLabel>Switch Ticket</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {isLoadingTickets ? (
              <DropdownMenuRadioItem value="loading" disabled>Loading tickets...</DropdownMenuRadioItem>
            ) : allTicketIds.length === 0 ? (
              <DropdownMenuRadioItem value="no-tickets" disabled>No other tickets found.</DropdownMenuRadioItem>
            ) : (
              <DropdownMenuRadioGroup value={currentTicketId || ""} onValueChange={onSelectTicket}>
                {allTicketIds.map((id) => ( // Removed sort here as it's sorted in page.tsx
                  <DropdownMenuRadioItem key={id} value={id}>
                    {id}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onNewTicket} aria-label="Start new ticket">
                <FilePlus2 className="w-5 h-5 text-muted-foreground hover:text-primary" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Start New Ticket</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onEndChat} aria-label="End current chat session">
                <LogOut className="w-5 h-5 text-muted-foreground hover:text-amber-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>End Chat Session</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onDeleteChat} aria-label="Delete current ticket permanently">
                <Trash2 className="w-5 h-5 text-muted-foreground hover:text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete Ticket Permanently</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
}
