import { useState, useEffect, useCallback } from 'react'
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  getDocs,
  where,
  DocumentSnapshot
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DirectMessage } from '@/types/chat'

export interface Conversation {
  recipient: string
  recipientName: string
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
  conversationId: string
}

export function useInbox(currentUserEmail: string) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalUnreadCount, setTotalUnreadCount] = useState(0)

  // Get all conversations for the current user
  const loadConversations = useCallback(async () => {
    if (!currentUserEmail) return

    try {
      setLoading(true)
      setError(null)

      // Get all private message collections where the user is involved
      const privateMessagesRef = collection(db, 'privateMessages')
      const conversationsSnapshot = await getDocs(privateMessagesRef)
      
      const conversationPromises = conversationsSnapshot.docs.map(async (doc) => {
        const conversationId = doc.id
        const [user1, user2] = conversationId.split('_')
        
        // Determine who the other person is in this conversation
        const otherUser = user1 === currentUserEmail ? user2 : user1
        
        // Get the last message in this conversation
        const messagesRef = collection(db, 'privateMessages', conversationId, 'messages')
        const messagesQuery = query(
          messagesRef,
          orderBy('timestamp', 'desc'),
          limit(1)
        )
        
        const lastMessageSnapshot = await getDocs(messagesQuery)
        const lastMessage = lastMessageSnapshot.docs[0]
        
        if (!lastMessage) return null
        
        const lastMessageData = lastMessage.data()
        
        // Count unread messages (messages not from current user)
        const unreadQuery = query(
          messagesRef,
          where('senderEmail', '!=', currentUserEmail),
          where('read', '==', false)
        )
        
        const unreadSnapshot = await getDocs(unreadQuery)
        const unreadCount = unreadSnapshot.size
        
        return {
          recipient: otherUser,
          recipientName: otherUser.split('@')[0], // Simple name extraction
          lastMessage: lastMessageData.text,
          lastMessageTime: lastMessageData.timestamp?.toDate() || new Date(),
          unreadCount,
          conversationId
        }
      })
      
      const resolvedConversations = await Promise.all(conversationPromises)
      const validConversations = resolvedConversations.filter(Boolean) as Conversation[]
      
      // Sort by last message time (most recent first)
      validConversations.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime())
      
      setConversations(validConversations)
      
      // Calculate total unread count
      const total = validConversations.reduce((sum, conv) => sum + conv.unreadCount, 0)
      setTotalUnreadCount(total)
      
    } catch (err) {
      console.error('Error loading conversations:', err)
      setError('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }, [currentUserEmail])

  // Load conversations on mount and when user changes
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Mark messages as read
  const markAsRead = useCallback(async (conversationId: string) => {
    if (!currentUserEmail) return

    try {
      const messagesRef = collection(db, 'privateMessages', conversationId, 'messages')
      const unreadQuery = query(
        messagesRef,
        where('senderEmail', '!=', currentUserEmail),
        where('read', '==', false)
      )
      
      const unreadSnapshot = await getDocs(unreadQuery)
      
      // In a real app, you'd update the documents to mark them as read
      // For now, we'll just reload the conversations
      await loadConversations()
      
    } catch (err) {
      console.error('Error marking messages as read:', err)
    }
  }, [currentUserEmail, loadConversations])

  // Refresh conversations
  const refresh = useCallback(() => {
    loadConversations()
  }, [loadConversations])

  return {
    conversations,
    loading,
    error,
    totalUnreadCount,
    markAsRead,
    refresh
  }
} 