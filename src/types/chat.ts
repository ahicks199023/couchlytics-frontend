export interface ChatMessage {
  id: string
  text: string
  sender: string
  senderEmail: string
  timestamp: Date
  edited?: boolean
  editedAt?: Date
  deleted?: boolean
  deletedAt?: Date
  deletedBy?: string
  moderated?: boolean
  moderatedBy?: string
  moderatedAt?: Date
  // Enhanced features
  reactions?: MessageReaction[]
  attachments?: FileAttachment[]
  replyTo?: string // ID of message being replied to
}

export interface LeagueChatMessage extends ChatMessage {
  leagueId: string
}

export interface DirectMessage extends ChatMessage {
  conversationId: string
  recipient: string
}

export interface MessageReaction {
  emoji: string
  users: string[] // Array of user emails who reacted
  count: number
}

export interface FileAttachment {
  id: string
  name: string
  url: string
  type: 'image' | 'document' | 'video' | 'audio'
  size: number
  uploadedAt: Date
}

export interface TypingIndicator {
  userEmail: string
  userName: string
  timestamp: Date
}

export interface ChatState {
  messages: ChatMessage[]
  loading: boolean
  error: string | null
  hasMore: boolean
  typingUsers: TypingIndicator[]
  reactions: Record<string, MessageReaction[]>
}

export interface SendMessageParams {
  text: string
  sender: string
  senderEmail: string
}

export interface UseChatReturn extends ChatState {
  sendMessage: (params: SendMessageParams) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  editMessage: (messageId: string, newText: string) => Promise<void>
  reactToMessage: (messageId: string, emoji: string, userEmail: string) => Promise<void>
  loadMoreMessages: () => Promise<void>
} 