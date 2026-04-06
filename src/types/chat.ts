export type ChatChannelType = 'complexo' | 'faccao' | 'mail';

export type ChatMessage = {
  id: string;
  channel: ChatChannelType;

  senderId: string;
  senderName: string;

  recipientId?: string | null;
  recipientName?: string | null;

  factionId?: string | null;

  subject?: string | null;
  body: string;

  createdAt: string;

  read?: boolean;
  system?: boolean;
};