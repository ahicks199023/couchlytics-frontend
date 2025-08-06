import { ChatMessage, LeagueChatMessage, GlobalChatMessage, DirectMessage } from '@/types/chat'

/**
 * Generate a consistent conversation ID for two users
 * Always sorts emails alphabetically to ensure consistency
 */
export const generateConversationId = (user1Email: string, user2Email: string): string => {
  const sortedEmails = [user1Email, user2Email].sort()
  return `${sortedEmails[0]}_${sortedEmails[1]}`
}

/**
 * Format timestamp for display
 */
export const formatTimestamp = (timestamp: Date): string => {
  const now = new Date()
  const diffInHours = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60)
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60))
    return `${diffInMinutes}m ago`
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`
  } else {
    return timestamp.toLocaleDateString()
  }
}

/**
 * Group messages by sender for display
 */
export const groupMessagesBySender = (messages: ChatMessage[]) => {
  const groups: Array<{
    sender: string
    senderEmail: string
    messages: ChatMessage[]
  }> = []
  
  messages.forEach(message => {
    const lastGroup = groups[groups.length - 1]
    
    if (lastGroup && lastGroup.senderEmail === message.senderEmail) {
      lastGroup.messages.push(message)
    } else {
      groups.push({
        sender: message.sender,
        senderEmail: message.senderEmail,
        messages: [message]
      })
    }
  })
  
  return groups
}

/**
 * Check if user can moderate messages
 */
export const canModerate = (userEmail: string, isAdmin: boolean, isCommissioner: boolean = false): boolean => {
  return isAdmin || isCommissioner
}

/**
 * Check if user can edit/delete their own message
 */
export const canEditMessage = (message: ChatMessage, userEmail: string): boolean => {
  return message.senderEmail === userEmail && !message.deleted
}

/**
 * Check if user can delete any message (admin/mod)
 */
export const canDeleteAnyMessage = (userEmail: string, isAdmin: boolean, isCommissioner: boolean = false): boolean => {
  return isAdmin || isCommissioner
} 