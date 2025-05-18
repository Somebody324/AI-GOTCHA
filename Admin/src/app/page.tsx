
// src/app/page.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { TicketList } from '@/components/app/ticket-list';
import { ChatPanel } from '@/components/app/chat-panel';
import { SuggestionsPanel } from '@/components/app/suggestions-panel';
import type { Message } from '@/types/chat';
import { db } from '@/lib/firebase'; // db can be null
import { ref as dbRef, get, child, set, onChildAdded, onChildRemoved, off, DataSnapshot, Unsubscribe, query, orderByChild, limitToLast, onValue, remove } from 'firebase/database';
import { Loader2 } from 'lucide-react';

interface Ticket {
  id: string;
  subject: string;
  lastMessage: string;
  messageHistory?: Message[];
  hasFetchedMessages?: boolean;
}

const createDateFromTimeString = (timeString: string): Date => {
  const today = new Date();
  if (typeof timeString !== 'string' || !timeString.includes(':')) {
    const parsedDate = new Date(timeString); // Try parsing directly if not HH:mm:ss
    if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
    }
    // Default to now if unparseable
    return today;
  }
  const parts = timeString.split(':').map(Number);
  if (parts.length === 3 && parts.every(part => !isNaN(part))) {
    const [hours, minutes, seconds] = parts;
    today.setHours(hours, minutes, seconds, 0);
  } else {
    // Attempt to parse as a full date string if not HH:mm:ss
    const parsedDate = new Date(timeString);
    if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
    }
    // Default to now if still unparseable
  }
  return today;
};

const getFormattedTimestampKey = (date: Date): string => {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const fetchContextTagsForTicketList = async (ticketId: string): Promise<string> => {
  if (!db) return "Context tags unavailable (DB error).";
  try {
    const contextTagsRef = dbRef(db, `tickets/${ticketId}/interaction_log/code/details/context_tags`);
    const contextTagsSnapshot = await get(contextTagsRef);
    if (contextTagsSnapshot.exists()) {
      const tags = contextTagsSnapshot.val();
      if (tags && typeof tags === 'string' && tags.trim() !== "") {
        return tags;
      } else if (tags && typeof tags === 'object' && JSON.stringify(tags) !== "{}") {
        const stringifiedTags = JSON.stringify(tags);
        // Truncate if too long for a preview
        return stringifiedTags.length > 50 ? stringifiedTags.substring(0, 50) + "..." : stringifiedTags;
      } else if (tags && typeof tags !== 'object' && String(tags).trim() !== "") {
         const stringifiedPrimitive = String(tags);
         return stringifiedPrimitive.length > 50 ? stringifiedPrimitive.substring(0, 50) + "..." : stringifiedPrimitive;
      }
      // If tags exist but are empty string, empty object, or non-string primitive that stringifies to empty
      return "Context tags are empty.";
    }
    return ""; // Return empty string if path not found for context_tags
  } catch (tagError) {
    console.warn(`Error fetching context_tags for ticket ${ticketId}:`, tagError);
    return "Error fetching context tags.";
  }
};


export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [botSuggestions, setBotSuggestions] = useState<string[]>([]);
  const [currentContextTags, setCurrentContextTags] = useState<string[]>([]);
  const [isLoadingBotSuggestions, setIsLoadingBotSuggestions] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);


  const messageListenersRef = useRef<{
    agentAddedUnsubscribe?: Unsubscribe,
    agentRemovedUnsubscribe?: Unsubscribe,
    customerAddedUnsubscribe?: Unsubscribe,
    customerRemovedUnsubscribe?: Unsubscribe,
    botOutputUnsubscribe?: Unsubscribe
  }>({});


  // Initial fetch of tickets
  useEffect(() => {
    const fetchInitialTickets = async () => {
      if (!db) {
        console.warn("Firebase DB not initialized. Skipping ticket fetch. Please check your .env configuration.");
        setIsLoadingTickets(false);
        setTickets([]);
        return;
      }
      setIsLoadingTickets(true);
      try {
        const ticketsRootRef = dbRef(db, 'tickets');
        const snapshot = await get(ticketsRootRef);

        if (snapshot.exists()) {
          const ticketData = snapshot.val();
          const ticketIds = Object.keys(ticketData);

          const ticketsWithContextTagsPromises = ticketIds.map(async (ticketId) => {
            const contextTagMessage = await fetchContextTagsForTicketList(ticketId);
            return {
              id: ticketId,
              subject: ticketId, // Ticket ID is used as the subject
              lastMessage: contextTagMessage || " ", // Display context tags or an empty string
              messageHistory: [],
              hasFetchedMessages: false,
            };
          });

          const fetchedTickets = await Promise.all(ticketsWithContextTagsPromises);
          setTickets(fetchedTickets);
        } else {
          setTickets([]);
        }
      } catch (error) {
        console.error("Error fetching initial ticket IDs from Firebase:", error);
        setTickets([]);
      } finally {
        setIsLoadingTickets(false);
      }
    };
    fetchInitialTickets();
  }, []); // Removed db from dependencies as it's not expected to change

  // Real-time listeners for new and removed tickets
  useEffect(() => {
    if (!db) {
      return; // Do not attach listeners if db is not initialized
    }

    const ticketsRef = dbRef(db, 'tickets');
    let ticketAddedListener: Unsubscribe | undefined;
    let ticketRemovedListener: Unsubscribe | undefined;

    const handleNewTicket = async (snapshot: DataSnapshot) => {
      const newTicketId = snapshot.key;
      if (!newTicketId) return;

      // Fetch context_tags for the new ticket
      const contextTagMessage = await fetchContextTagsForTicketList(newTicketId);

      setTickets(prevTickets => {
        // Only add if it's not already in the list
        if (!prevTickets.some(t => t.id === newTicketId)) {
          const newTicket: Ticket = {
            id: newTicketId,
            subject: newTicketId, // Use ticket ID as subject
            lastMessage: contextTagMessage || " ", // Display context_tags or empty string
            messageHistory: [],
            hasFetchedMessages: false,
          };
          return [...prevTickets, newTicket];
        }
        return prevTickets; // Return previous state if ticket already exists
      });
    };

    const handleRemovedTicketFn = (snapshot: DataSnapshot) => {
      const removedTicketId = snapshot.key;
      if (removedTicketId) {
        setTickets(prevTickets => prevTickets.filter(ticket => ticket.id !== removedTicketId));
        // If the selected ticket is the one removed, clear selection and related states
        if (selectedTicketId === removedTicketId) {
          setSelectedTicketId(null);
          // No need to clear botSuggestions, currentContextTags, inputValue here as they are tied to selectedTicketId
          // and will clear/reset when selectedTicketId becomes null (handled by other effects)
        }
      }
    };

    const errorCallback = (error: Error) => {
      console.error("Error with Firebase ticket listener:", error);
    };

    ticketAddedListener = onChildAdded(ticketsRef, handleNewTicket, errorCallback);
    ticketRemovedListener = onChildRemoved(ticketsRef, handleRemovedTicketFn, errorCallback);

    // Cleanup function to detach listeners when the component unmounts or db changes
    return () => {
      if (ticketAddedListener) off(ticketsRef, 'child_added', ticketAddedListener);
      if (ticketRemovedListener) off(ticketsRef, 'child_removed', ticketRemovedListener);
      // Also cleanup message listeners if any were attached
      cleanupMessageListeners();
    };
  }, [db]); // Dependency on db ensures listeners re-attach if db instance changes (though unlikely here)


   const cleanupMessageListeners = useCallback(() => {
        if (messageListenersRef.current.agentAddedUnsubscribe) {
            messageListenersRef.current.agentAddedUnsubscribe();
        }
        if (messageListenersRef.current.agentRemovedUnsubscribe) {
            messageListenersRef.current.agentRemovedUnsubscribe();
        }
        if (messageListenersRef.current.customerAddedUnsubscribe) {
            messageListenersRef.current.customerAddedUnsubscribe();
        }
        if (messageListenersRef.current.customerRemovedUnsubscribe) {
            messageListenersRef.current.customerRemovedUnsubscribe();
        }
        if (messageListenersRef.current.botOutputUnsubscribe) {
            messageListenersRef.current.botOutputUnsubscribe();
        }
        messageListenersRef.current = {}; // Reset the ref
    }, []);

   // Effect to cleanup message listeners and reset states when selectedTicketId changes or component unmounts
   useEffect(() => {
    if (!selectedTicketId) {
        cleanupMessageListeners();
        setMessages([]);
        setBotSuggestions([]);
        setCurrentContextTags([]);
        setInputValue(''); // Clear input if no ticket is selected
    }
    // Cleanup for component unmount is handled by the useEffect that sets up ticket listeners
  }, [selectedTicketId, cleanupMessageListeners]);


  const processBotOutputSnapshot = useCallback((snapshot: DataSnapshot | null, currentTicketId: string | null) => {
    if (!currentTicketId) {
      setBotSuggestions([]);
      setCurrentContextTags([]);
      return;
    }
    setIsLoadingBotSuggestions(true);

    let newSuggestions: string[] = [];
    let newContextTags: string[] = [];

    if (snapshot && snapshot.exists()) {
      const botOutputData = snapshot.val();
      const timestamps = Object.keys(botOutputData).sort();
      // console.log(`Processing bot_output for ticket ${currentTicketId}, timestamps:`, timestamps);

      if (timestamps.length > 0) {
        const latestTimestampKey = timestamps[timestamps.length - 1];
        const latestBotOutputEntry = botOutputData[latestTimestampKey];
        // console.log(`Latest bot_output entry for ticket ${currentTicketId} (key: ${latestTimestampKey}):`, latestBotOutputEntry);

        if (latestBotOutputEntry && latestBotOutputEntry.hasOwnProperty('agent_script_suggestions_block')) {
          const suggestionsSource = latestBotOutputEntry.agent_script_suggestions_block;
          let parsedSuggestions: string[] = [];

          if (typeof suggestionsSource === 'string') {
            parsedSuggestions = suggestionsSource.split('\n').filter(s => s.trim() !== '');
          } else if (Array.isArray(suggestionsSource)) {
            parsedSuggestions = suggestionsSource.filter(s => typeof s === 'string' && s.trim() !== '');
          } else {
            const actualType = typeof suggestionsSource;
            const valuePreview = actualType === 'object' && suggestionsSource !== null
              ? JSON.stringify(suggestionsSource).substring(0, 100) + '...'
              : String(suggestionsSource).substring(0,100) + '...';
            console.warn(`'agent_script_suggestions_block' for ticket ${currentTicketId} was expected to be a string or an array of strings, but found type '${actualType}'. Value preview: ${valuePreview}`);
          }

          newSuggestions = parsedSuggestions.map(suggestion => {
            let processedSuggestion = suggestion.trim();
            const alphaPrefixMatch = processedSuggestion.match(/^(Suggestion\s+[A-Z]:\s*)(.*)/i);
            if (alphaPrefixMatch && alphaPrefixMatch[2]) {
              processedSuggestion = alphaPrefixMatch[2].trim();
            }
            processedSuggestion = processedSuggestion.replace(/^\d+\.\s*/, '').trim();
            return processedSuggestion;
          }).filter(s => s.trim() !== '');
        } else {
           if (latestBotOutputEntry) {
               console.log(`No 'agent_script_suggestions_block' field found in the latest bot_output entry for ticket ${currentTicketId}. Entry keys:`, Object.keys(latestBotOutputEntry));
          } else {
               console.log(`Latest bot_output entry (key: ${latestTimestampKey}) is missing or malformed for ticket ${currentTicketId}.`);
          }
        }

        if (latestBotOutputEntry && typeof latestBotOutputEntry.context_tags === 'string') {
          const tagsString = latestBotOutputEntry.context_tags;
          const tagsMatch = tagsString.match(/\[(.*?)\]/);
          if (tagsMatch && tagsMatch[1]) {
            newContextTags.push(...tagsMatch[1].split(',').map(tag => tag.trim().replace(/([a-z])([A-Z])/g, '$1 $2')).filter(tag => tag.length > 0));
          }

          const priorityMatch = tagsString.match(/Priority:\s*(.*)/i);
          if (priorityMatch && priorityMatch[1]) {
            const priorityTag = `Priority: ${priorityMatch[1].trim()}`;
            if (!newContextTags.some(tag => tag.toLowerCase() === priorityTag.toLowerCase())) {
                 newContextTags.push(priorityTag);
            }
          } else if (!tagsMatch && tagsString.includes(',') && !tagsString.includes('[')) {
             newContextTags.push(...tagsString.split(',').map(tag => tag.trim().replace(/([a-z])([A-Z])/g, '$1 $2')).filter(tag => tag.length > 0));
          } else if (!tagsMatch && tagsString.trim().length > 0 && !tagsString.toLowerCase().startsWith('priority:')) {
             newContextTags.push(tagsString.trim().replace(/([a-z])([A-Z])/g, '$1 $2'));
          }

          const priorityTagIndex = newContextTags.findIndex(tag => tag.toLowerCase().startsWith('priority:'));
          if (priorityTagIndex > -1) {
            const [priorityItem] = newContextTags.splice(priorityTagIndex, 1);
            newContextTags.unshift(priorityItem);
          }
        } else {
          console.log(`No 'context_tags' string found or it's not a string in the latest bot_output entry for ticket ${currentTicketId}.`);
        }
      } else {
        console.log(`No timestamped entries found under bot_output for ticket ${currentTicketId}.`);
      }
    } else {
      console.log(`No 'bot_output' node found or it's empty for ticket ${currentTicketId}.`);
    }
    setBotSuggestions(newSuggestions);
    setCurrentContextTags(newContextTags);
    setIsLoadingBotSuggestions(false);
  }, []);


  // Effect to update displayed messages when selectedTicketId or tickets (messageHistory) changes
  useEffect(() => {
    if (!selectedTicketId) {
      setMessages([]); // Clear messages if no ticket is selected
      return;
    }

    const currentTicket = tickets.find(t => t.id === selectedTicketId);

    if (currentTicket && currentTicket.hasFetchedMessages && currentTicket.messageHistory) {
      const sortedHistory = [...currentTicket.messageHistory].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      setMessages(sortedHistory);
    } else if (currentTicket && !currentTicket.hasFetchedMessages) {
      // This case is primarily when a ticket is selected for the first time.
      // `handleSelectTicket` will set `setMessages([])` before starting the fetch.
      // So, no explicit action needed here until `hasFetchedMessages` becomes true.
    } else if (!currentTicket) {
      setMessages([]);
    }
  }, [selectedTicketId, tickets]);


  const handleSelectTicket = useCallback(async (ticketId: string) => {
    if (!db) {
      console.warn("Firebase DB not initialized. Cannot select ticket.");
      return;
    }

    cleanupMessageListeners();
    setSelectedTicketId(ticketId);
    setInputValue('');

    const ticketToLoad = tickets.find(t => t.id === ticketId);

    if (!ticketToLoad) {
      console.warn(`Ticket ${ticketId} not found in local state. Message loading skipped.`);
      setMessages([]);
      setIsLoadingMessages(false);
      setBotSuggestions([]);
      setCurrentContextTags([]);
      return;
    }

    if (ticketToLoad.hasFetchedMessages && ticketToLoad.messageHistory) {
      setIsLoadingMessages(false);
      // The useEffect watching [selectedTicketId, tickets] will set messages from cache.
    } else {
      setMessages([]);
      setIsLoadingMessages(true);
      try {
        const ticketMessagesRootRef = dbRef(db, `tickets/${ticketId}`);
        const snapshot = await get(ticketMessagesRootRef);
        let fetchedMessages: Message[] = [];
        let lastMessageTextForTicketList = ticketToLoad.lastMessage || "Loading...";

        if (snapshot.exists()) {
          const ticketNodeData = snapshot.val();

          if (ticketNodeData.Agent && typeof ticketNodeData.Agent === 'object') {
            const agentMessagePromises = Object.entries(ticketNodeData.Agent).map(async ([msgKey, msgContent]: [string, any]) => {
              if (msgContent && typeof msgContent.content === 'string') {
                // Check for agent_id and delete if PRESENT
                if (msgContent.agent_id && String(msgContent.agent_id).trim() !== "") {
                  console.warn(`Agent message ${msgKey} for ticket ${ticketId} HAS an agent_id. Deleting from Firebase as per new rule.`);
                  const msgPath = `tickets/${ticketId}/Agent/${msgKey}`;
                  try {
                    await remove(dbRef(db, msgPath));
                    console.log(`Deleted Agent message ${msgKey} for ticket ${ticketId} due to presence of agent_id.`);
                  } catch (deleteError) {
                    console.error(`Failed to delete Agent message ${msgKey} for ticket ${ticketId}:`, deleteError);
                  }
                  return null; // Do not add this message to fetchedMessages
                }
                return {
                  id: `${ticketId}-Agent-${msgKey}`,
                  text: msgContent.content,
                  sender: 'user', // Agent's messages are 'user' for UI alignment
                  timestamp: createDateFromTimeString(msgKey),
                };
              }
              return null;
            });
            const resolvedAgentMessages = (await Promise.all(agentMessagePromises)).filter(msg => msg !== null) as Message[];
            fetchedMessages.push(...resolvedAgentMessages);
          }

          const customerIdKey = Object.keys(ticketNodeData).find(key =>
              key !== 'interaction_log' && key !== 'Agent' && key !== 'bot_output' && key !== 'details' &&
              ticketNodeData[key] && typeof ticketNodeData[key] === 'object' &&
              (ticketNodeData[key].messages || typeof Object.values(ticketNodeData[key])[0] === 'object')
          );

          if (customerIdKey && ticketNodeData[customerIdKey]) {
              const customerNode = ticketNodeData[customerIdKey];
              const customerMessagesDataSource = customerNode.messages || customerNode;
              if (typeof customerMessagesDataSource === 'object' && customerMessagesDataSource !== null) {
                   Object.entries(customerMessagesDataSource).forEach(([msgKey, msgContent]: [string, any]) => {
                      if (msgContent && typeof msgContent.content === 'string') {
                          fetchedMessages.push({
                              id: `${ticketId}-${customerIdKey}-${msgKey}`,
                              text: msgContent.content,
                              sender: 'agent',
                              timestamp: createDateFromTimeString(msgKey),
                          });
                      }
                   });
              }
          }

          fetchedMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          if (fetchedMessages.length > 0) {
            lastMessageTextForTicketList = fetchedMessages[fetchedMessages.length - 1].text;
          }
        }

        setMessages(fetchedMessages); // Directly set messages for immediate display

        setTickets(prevTickets =>
          prevTickets.map(t =>
            t.id === ticketId
              ? { ...t, messageHistory: [...fetchedMessages], lastMessage: lastMessageTextForTicketList, hasFetchedMessages: true }
              : t
          )
        );
      } catch (error) {
        console.error(`Error fetching initial messages for ticket ${ticketId}:`, error);
        setTickets(prevTickets =>
          prevTickets.map(t =>
            t.id === ticketId
              ? { ...t, messageHistory: [], lastMessage: "Error loading messages", hasFetchedMessages: true }
              : t
          )
        );
      } finally {
        setIsLoadingMessages(false);
      }
    }

    const agentMessagesPathRef = dbRef(db, `tickets/${ticketId}/Agent`);
    messageListenersRef.current.agentAddedUnsubscribe = onChildAdded(agentMessagesPathRef, async (newMessageSnapshot) => {
      const msgKey = newMessageSnapshot.key;
      const msgContent = newMessageSnapshot.val();
      if (!msgKey || !msgContent || typeof msgContent.content !== 'string') return;

      // Real-time check for agent_id and delete if PRESENT
      if (msgContent.agent_id && String(msgContent.agent_id).trim() !== "") {
        console.warn(`Real-time: Agent message ${msgKey} for ticket ${ticketId} HAS an agent_id. Deleting from Firebase as per new rule.`);
        try {
          await remove(newMessageSnapshot.ref);
          console.log(`Real-time: Deleted Agent message ${msgKey} for ticket ${ticketId} due to presence of agent_id.`);
        } catch (deleteError) {
          console.error(`Real-time: Failed to delete Agent message ${msgKey} for ticket ${ticketId}:`, deleteError);
        }
        return; // Stop processing this message for UI update if it was deleted
      }

      const newMessage: Message = {
        id: `${ticketId}-Agent-${msgKey}`, text: msgContent.content, sender: 'user', timestamp: createDateFromTimeString(msgKey)
      };
      setTickets(prevTs => prevTs.map(ticket => {
        if (ticket.id === ticketId) {
          let currentHistory = [...(ticket.messageHistory || [])];
          const existingMessageIndex = currentHistory.findIndex(m => m.id === newMessage.id);
          if (existingMessageIndex !== -1) {
            currentHistory[existingMessageIndex] = newMessage;
          } else {
            currentHistory.push(newMessage);
          }
          const sortedHistory = currentHistory.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          const lastMessageText = sortedHistory.length > 0 ? sortedHistory[sortedHistory.length - 1].text : ticket.lastMessage;
          return {...ticket, messageHistory: sortedHistory, lastMessage: lastMessageText, hasFetchedMessages: true };
        }
        return ticket;
      }));
    }, (error) => console.error(`Agent message listener error for ${ticketId}:`, error));

    messageListenersRef.current.agentRemovedUnsubscribe = onChildRemoved(agentMessagesPathRef, (removedMessageSnapshot) => {
        const msgKey = removedMessageSnapshot.key;
        if (msgKey) {
            const messageIdToRemove = `${ticketId}-Agent-${msgKey}`;
            setTickets(prevTs => prevTs.map(ticket => {
                if (ticket.id === ticketId) {
                    const updatedHistory = (ticket.messageHistory || []).filter(m => m.id !== messageIdToRemove);
                    const lastMessageText = updatedHistory.length > 0 ? updatedHistory[updatedHistory.length - 1].text : (ticket.lastMessage.startsWith("Context tags") ? ticket.lastMessage : "Message deleted");
                    return { ...ticket, messageHistory: updatedHistory, lastMessage: lastMessageText };
                }
                return ticket;
            }));
        }
    }, (error) => console.error(`Agent removed message listener error for ${ticketId}:`, error));

    get(dbRef(db, `tickets/${ticketId}`)).then(ticketNodeSnapshot => {
      if (ticketNodeSnapshot.exists()) {
        const ticketNodeDataForListener = ticketNodeSnapshot.val();
        const customerIdKeyForListener = Object.keys(ticketNodeDataForListener).find(key =>
            key !== 'interaction_log' && key !== 'Agent' && key !== 'bot_output' && key !== 'details' &&
            ticketNodeDataForListener[key] && typeof ticketNodeDataForListener[key] === 'object' &&
            (ticketNodeDataForListener[key].messages || typeof Object.values(ticketNodeDataForListener[key])[0] === 'object')
        );

        if (customerIdKeyForListener) {
          const customerNode = ticketNodeDataForListener[customerIdKeyForListener];
          const customerMessagesNodePath = customerNode.messages ? `tickets/${ticketId}/${customerIdKeyForListener}/messages` : `tickets/${ticketId}/${customerIdKeyForListener}`;
          const customerMessagesPathRef = dbRef(db, customerMessagesNodePath);

          messageListenersRef.current.customerAddedUnsubscribe = onChildAdded(customerMessagesPathRef, (newMessageSnapshot) => {
            const msgKey = newMessageSnapshot.key;
            const msgContent = newMessageSnapshot.val();
            if (msgKey && msgContent && typeof msgContent.content === 'string') {
              const newMessage: Message = {
                id: `${ticketId}-${customerIdKeyForListener}-${msgKey}`, text: msgContent.content, sender: 'agent', timestamp: createDateFromTimeString(msgKey)
              };
               setTickets(prevTs => prevTs.map(ticket => {
                  if (ticket.id === ticketId) {
                    let currentHistory = [...(ticket.messageHistory || [])];
                    const existingMessageIndex = currentHistory.findIndex(m => m.id === newMessage.id);
                    if (existingMessageIndex !== -1) {
                        currentHistory[existingMessageIndex] = newMessage;
                    } else {
                        currentHistory.push(newMessage);
                    }
                    const sortedHistory = currentHistory.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
                    const lastMessageText = sortedHistory.length > 0 ? sortedHistory[sortedHistory.length - 1].text : ticket.lastMessage;
                    return {...ticket, messageHistory: sortedHistory, lastMessage: lastMessageText, hasFetchedMessages: true };
                  }
                  return ticket;
                }));
            }
          }, (error) => console.error(`Customer message listener error for ${ticketId}:`, error));

          messageListenersRef.current.customerRemovedUnsubscribe = onChildRemoved(customerMessagesPathRef, (removedMessageSnapshot) => {
            const msgKey = removedMessageSnapshot.key;
            if (msgKey) {
                const messageIdToRemove = `${ticketId}-${customerIdKeyForListener}-${msgKey}`;
                setTickets(prevTs => prevTs.map(ticket => {
                    if (ticket.id === ticketId) {
                        const updatedHistory = (ticket.messageHistory || []).filter(m => m.id !== messageIdToRemove);
                        const lastMessageText = updatedHistory.length > 0 ? updatedHistory[updatedHistory.length - 1].text : (ticket.lastMessage.startsWith("Context tags") ? ticket.lastMessage : "Message deleted");
                        return { ...ticket, messageHistory: updatedHistory, lastMessage: lastMessageText };
                    }
                    return ticket;
                }));
            }
          }, (error) => console.error(`Customer removed message listener error for ${ticketId}:`, error));

        } else {
            console.warn(`Could not determine customerIdKey for listener setup on ticket ${ticketId}`);
        }
      }
    }).catch(error => console.error(`Error fetching ticket node for customer listener setup on ${ticketId}:`, error));

    const botOutputRef = dbRef(db, `tickets/${ticketId}/bot_output`);
    messageListenersRef.current.botOutputUnsubscribe = onValue(botOutputRef, (snapshot) => {
      processBotOutputSnapshot(snapshot, ticketId);
    }, (error) => {
      console.error(`Error with bot_output listener for ticket ${ticketId}:`, error);
      setBotSuggestions(["Error loading suggestions."]);
      setCurrentContextTags([]);
      setIsLoadingBotSuggestions(false);
    });

  }, [tickets, db, processBotOutputSnapshot, cleanupMessageListeners]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    if (!selectedTicketId || !db) return;

    const parts = messageId.split('-');
    const agentMarkerIndex = parts.indexOf('Agent');

    if (agentMarkerIndex === -1 || agentMarkerIndex >= parts.length -1 ) {
        console.error("Cannot delete message: Invalid message ID format or not an Agent message.", messageId);
        return;
    }

    const firebaseKey = parts.slice(agentMarkerIndex + 1).join('-');

    setTickets(prevTickets =>
        prevTickets.map(ticket => {
            if (ticket.id === selectedTicketId) {
                const updatedHistory = (ticket.messageHistory || []).filter(msg => msg.id !== messageId);
                const lastMessageText = updatedHistory.length > 0 ? updatedHistory[updatedHistory.length - 1].text : (ticket.lastMessage.startsWith("Context tags") ? ticket.lastMessage : "Message deleted");
                return { ...ticket, messageHistory: updatedHistory, lastMessage: lastMessageText };
            }
            return ticket;
        })
    );

    try {
        const messagePath = `tickets/${selectedTicketId}/Agent/${firebaseKey}`;
        await remove(dbRef(db, messagePath));
    } catch (error) {
        console.error("Error deleting message from Firebase:", error);
        // Consider reverting UI or showing error if critical
    }
  }, [selectedTicketId, db, tickets]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !selectedTicketId || !db || isSendingMessage) return;

    setIsSendingMessage(true);
    const messageTimestamp = new Date();

    const ticketBeforeSending = tickets.find(t => t.id === selectedTicketId);
    let oldestAgentMessageToDelete: Message | undefined = undefined;

    if (ticketBeforeSending && ticketBeforeSending.messageHistory) {
      const agentMessagesInHistory = ticketBeforeSending.messageHistory
        .filter(msg => msg.sender === 'user') // 'user' is the agent in UI terms
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      if (agentMessagesInHistory.length > 0) {
        oldestAgentMessageToDelete = agentMessagesInHistory[0];
      }
    }

    try {
      const timestampKey = getFormattedTimestampKey(messageTimestamp);
      const messageAgentRef = dbRef(db, `tickets/${selectedTicketId}/Agent/${timestampKey}`);
      // IMPORTANT: Based on the new request, messages sent from this app WILL HAVE agent_id.
      // The deletion logic above will then remove them if it finds an agent_id.
      // If this is not intended, handleSendMessage should NOT add agent_id,
      // or the deletion logic needs to be more specific.
      // For now, keeping agent_id as it was, to be consistent with prior state.
      await set(messageAgentRef, {
        content: text,
        agent_id: 'agent001'
      });
      setInputValue('');

      if (oldestAgentMessageToDelete) {
        await handleDeleteMessage(oldestAgentMessageToDelete.id);
      }

    } catch (error) {
      console.error("Error in handleSendMessage (sending new message or deleting old one):", error);
    } finally {
      setIsSendingMessage(false);
    }
  }, [selectedTicketId, db, isSendingMessage, tickets, handleDeleteMessage]);


  const handleSelectBotSuggestion = useCallback((suggestion: string) => {
    setInputValue(suggestion);
  }, []);


  if (isLoadingTickets && db) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading tickets...</p>
      </div>
    );
  }

  if (!db && isLoadingTickets) {
     return (
      <div className="flex h-screen w-screen items-center justify-center bg-background p-8 text-center">
        <div>
          <Loader2 className="h-8 w-8 animate-spin text-destructive mx-auto mb-4" />
          <p className="text-destructive font-semibold">Firebase Database Not Initialized</p>
          <p className="text-muted-foreground mt-2">
            Could not connect to Firebase. Please ensure your <code>.env</code> file is correctly configured with your Firebase project details and restart the application.
            Ticket functionality is currently unavailable.
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="w-1/4 min-w-[280px] max-w-[350px] h-full overflow-y-auto bg-card">
        <TicketList
          tickets={tickets}
          selectedTicketId={selectedTicketId}
          onSelectTicket={handleSelectTicket}
          disabled={!db}
        />
      </div>

      <div className="flex-1 h-full overflow-y-auto bg-background">
        {!db && !selectedTicketId && (
           <div className="flex items-center justify-center h-full p-4 text-center">
            <p className="text-muted-foreground">Firebase is not connected. Please check your configuration and restart the app.</p>
          </div>
        )}
        {db && selectedTicketId && isLoadingMessages && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading messages...</p>
            </div>
        )}
        {db && selectedTicketId && !isLoadingMessages && (
            <ChatPanel
              messages={messages}
              currentInputValue={inputValue}
              onInputValueChange={setInputValue}
              onSendMessage={handleSendMessage}
              isSendingMessage={isSendingMessage}
              onDeleteMessage={handleDeleteMessage}
            />
        )}
        {db && !selectedTicketId && (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">{tickets.length > 0 ? "Select a ticket to view the conversation." : (isLoadingTickets ? "Loading tickets..." : "No tickets available. Check Firebase connection or data.")}</p>
          </div>
        )}
      </div>

      <div className="w-1/4 min-w-[280px] max-w-[350px] h-full overflow-y-auto bg-card">
        {selectedTicketId && db ? (
          <SuggestionsPanel
            suggestions={botSuggestions}
            contextTags={currentContextTags}
            onSelectSuggestion={handleSelectBotSuggestion}
            isLoadingSuggestions={isLoadingBotSuggestions}
          />
        ) : (
           <div className="flex items-center justify-center h-full p-4 text-center">
            <p className="text-muted-foreground">
              { !db ? "Suggestions unavailable (Firebase not connected)." : "Select a ticket to see suggestions."}
            </p>
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
}
