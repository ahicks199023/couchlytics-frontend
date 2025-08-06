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
}

export interface LeagueChatMessage extends ChatMessage {
  leagueId: string
  moderated?: boolean
  moderatedBy?: string
  moderatedAt?: Date
}

export interface GlobalChatMessage extends ChatMessage {
  moderated?: boolean
  moderatedBy?: string
  moderatedAt?: Date
}

export interface DirectMessage extends ChatMessage {
  conversationId: string
  recipient: string
}

export interface ChatState {
  messages: ChatMessage[]
  loading: boolean
  error: string | null
  hasMore: boolean
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
  loadMoreMessages: () => Promise<void>
} 