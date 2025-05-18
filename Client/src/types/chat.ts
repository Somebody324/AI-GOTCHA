export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  isCurrentUser?: boolean;
}

export interface Message {
  id: string;
  sender: User;
  content: string;
  timestamp: Date;
}
