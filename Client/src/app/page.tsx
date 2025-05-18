
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChatLayout } from '@/components/chat/chat-layout';
import type { Message, User } from '@/types/chat';
import { ChatHeader } from '@/components/chat/chat-header';
import { QuerySuggestionButtons } from '@/components/chat/query-suggestion-buttons';
import { db } from '@/lib/firebase';
import { ref, onValue, set, off, remove, serverTimestamp, update, get } from 'firebase/database';
import { format as formatDateFns, parse as parseDateFns } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { generateTicketId } from '@/lib/generateTicketId';

const APP_VERSION = "AI.GOTCHA Client v1.0";

const currentUser: User = {
  id: 'user-123',
  name: 'You',
  avatarUrl: 'https://placehold.co/40x40.png?text=U',
  isCurrentUser: true,
};

const agentUser: User = {
  id: 'ai-gotcha-agent',
  name: 'AI·GOTCHA Agent',
  avatarUrl: 'https://placehold.co/40x40.png?text=A',
  isCurrentUser: false,
};

const sampleQueries = [
  "Missing cash from ATM",
  "Unauthorized transaction",
  "Account balance dispute",
  "Card declined",
  "Mobile deposit problem"
];

interface BotOutputEntry {
  agent_script_suggestions_block?: string;
  context_tags?: string;
  detected_customer_language?: string;
  detected_customer_sentiment_english?: string;
  objective_summary_english?: string;
  priority_tag?: string;
  related_customer_message_key?: string;
  ticket_id?: string;
  timestamp_iso?: string;
  turn_number_in_ticket?: number;
}

interface GlobalInsightEntry {
  insight_text?: string;
  related_bot_output_id?: string;
  source_summary?: string;
  ticket_id?: string;
  timestamp_iso?: string;
}


export default function AiGotchaPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);
  const [allTicketIds, setAllTicketIds] = useState<string[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [isChatActive, setIsChatActive] = useState(true);


  const fetchAndUpdateChatActiveState = useCallback(async (ticketId: string | null) => {
    if (!ticketId) {
      setIsChatActive(false); // No ticket, chat is not active
      return;
    }
    const ticketDetailsStatusPath = `tickets/${ticketId}/details/status`;
    try {
      const snapshot = await get(ref(db, ticketDetailsStatusPath));
      if (snapshot.exists() && snapshot.val() === "Ended") {
        setIsChatActive(false);
      } else {
        setIsChatActive(true); // Active if status is not "Ended" or if details/status doesn't exist yet
      }
    } catch (error) {
      console.error(`Failed to fetch status for ticket ${ticketId}:`, error);
      setIsChatActive(true); // Default to active on error for safety
    }
  }, []);


  const initializeNewTicket = useCallback(async (newTicketId: string) => {
    const ticketDetailsPath = `tickets/${newTicketId}/details`;
    const detailsToSet = {
      ticket_id: newTicketId,
      session_started_iso: serverTimestamp(),
      session_started_readable: new Date().toString(),
      status: "Active",
      tool_version: APP_VERSION,
      last_status_update_iso: serverTimestamp(),
    };
    try {
      await set(ref(db, ticketDetailsPath), detailsToSet);
      setIsChatActive(true); // New ticket is active
    } catch (error) {
      console.error("Failed to initialize ticket details:", error);
      toast({
        title: "Error",
        description: "Failed to initialize new ticket session details.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleStartNewTicket = useCallback(async () => {
    const newTicketId = generateTicketId();
    setCurrentTicketId(newTicketId);
    await initializeNewTicket(newTicketId); // This will set isChatActive to true
    if (typeof window !== 'undefined') {
        localStorage.setItem('currentTicketId_ai_gotcha', newTicketId);
    }
    toast({
      title: "New Ticket Started",
      description: `You are now on ticket: ${newTicketId}`,
    });
  }, [toast, initializeNewTicket]);


  useEffect(() => {
    const loadInitialTicket = async () => {
      const storedTicketId = typeof window !== 'undefined' ? localStorage.getItem('currentTicketId_ai_gotcha') : null;
      if (storedTicketId) {
        setCurrentTicketId(storedTicketId);
        await fetchAndUpdateChatActiveState(storedTicketId);
      } else {
        await handleStartNewTicket();
      }
    };
    loadInitialTicket();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAndUpdateChatActiveState]); // handleStartNewTicket is memoized

  useEffect(() => {
    setIsLoadingTickets(true);
    const ticketsRootRef = ref(db, 'tickets');

    const ticketsListener = onValue(ticketsRootRef, (snapshot) => {
      if (snapshot.exists()) {
        const ticketData = snapshot.val();
        const ids = Object.keys(ticketData);
        setAllTicketIds(ids.sort((a, b) => b.localeCompare(a)));
      } else {
        setAllTicketIds([]);
      }
      setIsLoadingTickets(false);
    }, (error) => {
      console.error("Failed to fetch ticket IDs:", error);
      toast({
        title: "Error",
        description: "Failed to load list of tickets.",
        variant: "destructive",
      });
      setIsLoadingTickets(false);
    });

    return () => {
      off(ticketsRootRef, 'value', ticketsListener);
    };
  }, [toast]);


  useEffect(() => {
    if (!currentTicketId) {
      setIsLoading(false);
      setMessages([]);
      setIsChatActive(false);
      return;
    }
    
    // Fetch active state when currentTicketId changes, e.g., after selecting an old ticket
    fetchAndUpdateChatActiveState(currentTicketId);

    if (typeof window !== 'undefined') {
      localStorage.setItem('currentTicketId_ai_gotcha', currentTicketId);
    }

    setIsLoading(true);
    const userMessagesPath = `tickets/${currentTicketId}/${currentUser.id}/messages`;
    const userMessagesRef = ref(db, userMessagesPath);

    const agentMessagesPath = `tickets/${currentTicketId}/Agent`;
    const agentMessagesRef = ref(db, agentMessagesPath);

    let userMessagesData: Message[] = [];
    let agentMessagesData: Message[] = [];
    
    const today = new Date();

    const combineAndSetMessages = () => {
      const combined = [...userMessagesData, ...agentMessagesData];
      combined.sort((a, b) => {
        const timeA = a.timestamp instanceof Date && !isNaN(a.timestamp.getTime()) ? a.timestamp.getTime() : 0;
        const timeB = b.timestamp instanceof Date && !isNaN(b.timestamp.getTime()) ? b.timestamp.getTime() : 0;
        return timeA - timeB;
      });
      setMessages(combined);
      setIsLoading(false);
    };

    const userMessagesListener = onValue(userMessagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        userMessagesData = Object.entries(data)
          .map(([key, value]: [string, any]) => {
            if (value && typeof (value as { content: string }).content === 'string') {
                const messageTimestamp = parseDateFns(key, 'HH:mm:ss', today);
                return {
                  id: `user-${currentTicketId}-${key}`,
                  sender: currentUser,
                  content: (value as { content: string }).content,
                  timestamp: messageTimestamp,
                };
            }
            return null;
          }).filter(Boolean) as Message[];
      } else {
        userMessagesData = [];
      }
      combineAndSetMessages();
    }, (error) => {
      console.error(`Firebase read failed for user messages (ticket: ${currentTicketId}):`, error);
      toast({
        title: "Error",
        description: `Failed to load your messages for ticket: ${currentTicketId}.`,
        variant: "destructive",
      });
      setIsLoading(false);
    });

    const agentMessagesListener = onValue(agentMessagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
         agentMessagesData = Object.entries(data)
          .map(([key, value]: [string, any]) => {
            if (value && typeof (value as { content: string }).content === 'string') {
              const messageTimestamp = parseDateFns(key, 'HH:mm:ss', today);
              return {
                id: `agent-${currentTicketId}-${key}`,
                sender: agentUser,
                content: (value as { content: string }).content,
                timestamp: messageTimestamp,
              };
            }
            return null;
          }).filter(Boolean) as Message[];
      } else {
        agentMessagesData = [];
      }
      combineAndSetMessages();
    }, (error) => {
      console.error(`Firebase read failed for agent messages (ticket: ${currentTicketId}):`, error);
    });

    return () => {
      off(userMessagesRef, 'value', userMessagesListener);
      off(agentMessagesRef, 'value', agentMessagesListener);
    };
  }, [currentTicketId, toast, currentUser.id, fetchAndUpdateChatActiveState]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!isChatActive) {
      toast({ title: "Chat Ended", description: "This chat session has ended. Cannot send new messages.", variant: "destructive" });
      return;
    }
    if (!currentTicketId) {
      toast({ title: "Error", description: "Session not initialized. Cannot send message.", variant: "destructive" });
      return;
    }

    const now = new Date();
    const messageKey = formatDateFns(now, 'HH:mm:ss');

    const newMessageData = {
      content,
    };

    const messagePath = `tickets/${currentTicketId}/${currentUser.id}/messages/${messageKey}`;

    try {
      await set(ref(db, messagePath), newMessageData);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
    }
  }, [currentUser.id, currentTicketId, toast, isChatActive]);


  const handleSelectTicket = async (ticketId: string) => {
    if (ticketId !== currentTicketId) {
      setCurrentTicketId(ticketId);
      await fetchAndUpdateChatActiveState(ticketId); // Fetch status for newly selected ticket
      toast({
        title: "Switched Ticket",
        description: `Now viewing ticket: ${ticketId}`,
      });
    }
  };
  
  const handleEndChat = useCallback(async () => {
    if (!currentTicketId) {
      toast({ title: "Error", description: "No active ticket to end.", variant: "destructive" });
      return;
    }

    let summaryToDisplay: string | null = null;
    let summaryMessageWritten = false;

    try {
      const botOutputPath = `tickets/${currentTicketId}/bot_output`;
      const botOutputSnapshot = await get(ref(db, botOutputPath));

      if (botOutputSnapshot.exists()) {
        const botOutputData = botOutputSnapshot.val() as Record<string, BotOutputEntry>;
        const botOutputKeys = Object.keys(botOutputData).sort(); 
        const latestBotOutputKey = botOutputKeys.length > 0 ? botOutputKeys[botOutputKeys.length - 1] : null;

        if (latestBotOutputKey) {
          const insightsLogPath = `tickets/${currentTicketId}/global_insights_log`;
          const insightsLogSnapshot = await get(ref(db, insightsLogPath));

          if (insightsLogSnapshot.exists()) {
            const insightsLogData = insightsLogSnapshot.val() as Record<string, GlobalInsightEntry>;
            for (const insightKey in insightsLogData) {
              const insight = insightsLogData[insightKey];
              if (insight.related_bot_output_id === latestBotOutputKey && insight.source_summary) {
                summaryToDisplay = insight.source_summary + "\n\nThis ticket has been resolved.";
                break; 
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching summary for end chat:", error);
    }

    if (summaryToDisplay) {
      const now = new Date();
      const summaryMessageKey = formatDateFns(now, 'HH:mm:ss');
      const summaryMessageData = { content: summaryToDisplay };
      const agentSummaryMessagePath = `tickets/${currentTicketId}/Agent/${summaryMessageKey}`;
      try {
        await set(ref(db, agentSummaryMessagePath), summaryMessageData);
        summaryMessageWritten = true; 
      } catch (error) {
        console.error("Failed to write summary message to Firebase:", error);
      }
    }

    const ticketDetailsPath = `tickets/${currentTicketId}/details`;
    const updates = {
      status: "Ended",
      session_ended_iso: serverTimestamp(),
      session_ended_readable: new Date().toString(),
      last_status_update_iso: serverTimestamp(),
    };
    try {
      await update(ref(db, ticketDetailsPath), updates);
      setIsChatActive(false); // Set chat to inactive
      toast({
        title: "Chat Session Ended",
        description: `Ticket ${currentTicketId} has been marked as ended. ${summaryMessageWritten ? "Summary added to chat." : ""}`,
      });
    } catch (error) {
      console.error("Failed to end ticket:", error);
      toast({
        title: "Error",
        description: `Failed to end ticket ${currentTicketId}.`,
        variant: "destructive",
      });
    }
  }, [currentTicketId, toast]);


  const handleConfirmDeleteChat = async () => {
    if (!currentTicketId) {
      toast({ title: "Error", description: "No active ticket to delete.", variant: "destructive" });
      setIsDeleteDialogOpen(false);
      return;
    }
    
    const ticketPath = `tickets/${currentTicketId}`;
    const ticketRefToDelete = ref(db, ticketPath);

    try {
      await remove(ticketRefToDelete);
      
      setIsDeleteDialogOpen(false);
      toast({
        title: "Ticket Deleted",
        description: `Ticket ${currentTicketId} and all its data have been permanently deleted. A new ticket has been started.`,
      });
      
      await handleStartNewTicket(); 

    } catch (error) {
      console.error("Failed to delete ticket:", error);
      setIsDeleteDialogOpen(false);
      toast({
        title: "Error",
        description: `Failed to delete ticket ${currentTicketId}.`,
        variant: "destructive",
      });
    }
  };

  const showSuggestionButtons = messages.length === 0 && !isLoading && !!currentTicketId && isChatActive;

  const pageIsLoading = (isLoading && !!currentTicketId) || isLoadingTickets || (!currentTicketId && typeof window !== 'undefined' && !localStorage.getItem('currentTicketId_ai_gotcha'));

  if (pageIsLoading && !showSuggestionButtons) { 
    return (
      <div className="flex flex-col h-screen max-h-screen bg-background overflow-hidden items-center justify-center">
        <ChatHeader
          onDeleteChat={() => setIsDeleteDialogOpen(true)}
          onNewTicket={handleStartNewTicket}
          onEndChat={handleEndChat}
          allTicketIds={allTicketIds}
          isLoadingTickets={isLoadingTickets}
          currentTicketId={currentTicketId}
          onSelectTicket={handleSelectTicket}
        />
        <p className="text-muted-foreground mt-4">Loading session...</p>
      </div>
    );
  }
  
  if (!currentTicketId && !isLoadingTickets) { 
     return (
      <div className="flex flex-col h-screen max-h-screen bg-background overflow-hidden items-center justify-center">
        <ChatHeader
          onDeleteChat={() => setIsDeleteDialogOpen(true)}
          onNewTicket={handleStartNewTicket}
          onEndChat={handleEndChat}
          allTicketIds={allTicketIds}
          isLoadingTickets={isLoadingTickets}
          currentTicketId={currentTicketId}
          onSelectTicket={handleSelectTicket}
        />
        <p className="text-muted-foreground mt-4">Initializing session...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-screen max-h-screen bg-background overflow-hidden">
        <ChatHeader
          onDeleteChat={() => setIsDeleteDialogOpen(true)}
          onNewTicket={handleStartNewTicket}
          onEndChat={handleEndChat}
          allTicketIds={allTicketIds}
          isLoadingTickets={isLoadingTickets}
          currentTicketId={currentTicketId}
          onSelectTicket={handleSelectTicket}
        />
        {showSuggestionButtons && (
          <QuerySuggestionButtons
            queries={sampleQueries}
            onQueryClick={(query) => handleSendMessage(query)}
          />
        )}
        <ChatLayout
          messages={messages}
          currentUser={currentUser} 
          onSendMessage={(content) => handleSendMessage(content)}
          isInputDisabled={!isChatActive}
        />
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the entire
              ticket ({currentTicketId}) and all its associated data, including user messages,
              agent messages, bot output, and any other information stored under this ticket.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteChat}>
              Delete Entire Ticket
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

