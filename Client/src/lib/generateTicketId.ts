
// src/lib/generateTicketId.ts
export function generateTicketId(): string {
  let lastTicketNum = 0;
  // localStorage is only available in the browser
  if (typeof window !== 'undefined') {
    const storedNum = localStorage.getItem('lastTicketNumber_ai_gotcha'); // Added app-specific suffix
    if (storedNum) {
      // Ensure it's a valid number, default to 0 if parsing fails
      const parsedNum = parseInt(storedNum, 10);
      if (!isNaN(parsedNum)) {
        lastTicketNum = parsedNum;
      }
    }
  }

  const newTicketNum = lastTicketNum + 1;

  if (typeof window !== 'undefined') {
    localStorage.setItem('lastTicketNumber_ai_gotcha', newTicketNum.toString());
  }

  // Format the number with leading zeros to ensure it's at least 4 digits
  const formattedTicketNum = newTicketNum.toString().padStart(4, '0');
  return `ticket-uuid-${formattedTicketNum}`;
}
