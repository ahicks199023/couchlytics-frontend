import { useState, useEffect, useCallback } from 'react'
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  startAfter,
  getDocs,
  getDoc,
  DocumentSnapshot
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ChatMessage, SendMessageParams, UseChatReturn } from '@/types/chat'

const MESSAGES_PER_PAGE = 50

export default function useGlobalMessages(enabled: boolean = true): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [lastMessage, setLastMessage] = useState<DocumentSnapshot | null>(null)

  // Load initial messages
  useEffect(() => {
    if (!enabled || !db) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    const messagesRef = collection(db, 'globalChatMessages')
    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limit(MESSAGES_PER_PAGE)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newMessages: ChatMessage[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          newMessages.push({
            id: doc.id,
            text: data.text,
            sender: data.sender,
            senderEmail: data.senderEmail,
            timestamp: data.timestamp?.toDate() || new Date(),
            edited: data.edited || false,
            editedAt: data.editedAt?.toDate(),
            deleted: data.deleted || false,
            deletedAt: data.deletedAt?.toDate(),
            deletedBy: data.deletedBy,
            moderated: data.moderated || false,
            moderatedBy: data.moderatedBy,
            moderatedAt: data.moderatedAt?.toDate(),
            reactions: data.reactions || []
          })
        })

        // Reverse to show newest at bottom
        setMessages(newMessages.reverse())
        setLoading(false)

        if (snapshot.docs.length > 0) {
          setLastMessage(snapshot.docs[snapshot.docs.length - 1])
        }
        setHasMore(snapshot.docs.length === MESSAGES_PER_PAGE)
      },
      (err) => {
        console.error('Error loading global chat messages:', err)
        const code = (err as { code?: string }).code || ''
        if (code === 'permission-denied') {
          setError('Missing or insufficient permissions.')
        } else {
          setError('Failed to load messages')
        }
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [enabled])

  const sendMessage = useCallback(async ({ text, sender, senderEmail }: SendMessageParams) => {
    if (!text.trim() || !enabled || !db) return

    try {
      const messagesRef = collection(db, 'globalChatMessages')
      await addDoc(messagesRef, {
        text: text.trim(),
        sender,
        senderEmail,
        timestamp: serverTimestamp(),
        moderated: false
      })
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Failed to send message')
    }
  }, [enabled])

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!db) return
    try {
      const messageRef = doc(db, 'globalChatMessages', messageId)
      await updateDoc(messageRef, {
        deleted: true,
        deletedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error deleting message:', err)
      setError('Failed to delete message')
    }
  }, [])

  const editMessage = useCallback(async (messageId: string, newText: string) => {
    if (!newText.trim() || !enabled || !db) return

    try {
      const messageRef = doc(db, 'globalChatMessages', messageId)
      await updateDoc(messageRef, {
        text: newText.trim(),
        edited: true,
        editedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error editing message:', err)
      setError('Failed to edit message')
    }
  }, [enabled])

  const reactToMessage = useCallback(async (messageId: string, emoji: string, userEmail: string) => {
    if (!db) return
    try {
      const messageRef = doc(db, 'globalChatMessages', messageId)
      const messageDoc = await getDoc(messageRef)
      
      if (!messageDoc.exists()) {
        console.error('Message not found')
        return
      }

      const messageData = messageDoc.data()
      const currentReactions = messageData.reactions || []
      
      // Find existing reaction for this emoji
      const existingReactionIndex = currentReactions.findIndex((r: { emoji: string; users: string[]; count: number }) => r.emoji === emoji)
      
      let updatedReactions
      if (existingReactionIndex >= 0) {
        // Update existing reaction
        const existingReaction = currentReactions[existingReactionIndex]
        const userIndex = existingReaction.users.indexOf(userEmail)
        
        if (userIndex >= 0) {
          // Remove user's reaction
          existingReaction.users.splice(userIndex, 1)
          existingReaction.count = Math.max(0, existingReaction.count - 1)
          
          if (existingReaction.count === 0) {
            // Remove reaction entirely if no users
            updatedReactions = currentReactions.filter((_: { emoji: string; users: string[]; count: number }, index: number) => index !== existingReactionIndex)
          } else {
            updatedReactions = [...currentReactions]
            updatedReactions[existingReactionIndex] = existingReaction
          }
        } else {
          // Add user's reaction
          existingReaction.users.push(userEmail)
          existingReaction.count += 1
          updatedReactions = [...currentReactions]
          updatedReactions[existingReactionIndex] = existingReaction
        }
      } else {
        // Create new reaction
        const newReaction = {
          emoji,
          users: [userEmail],
          count: 1
        }
        updatedReactions = [...currentReactions, newReaction]
      }

      await updateDoc(messageRef, {
        reactions: updatedReactions
      })
    } catch (err) {
      console.error('Error reacting to message:', err)
      setError('Failed to react to message')
    }
  }, [])

  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || !lastMessage || !enabled || !db) return

    try {
      const messagesRef = collection(db, 'globalChatMessages')
      const q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        startAfter(lastMessage),
        limit(MESSAGES_PER_PAGE)
      )

      const snapshot = await getDocs(q)
      const newMessages: ChatMessage[] = []
      
      snapshot.forEach((doc) => {
        const data = doc.data()
        newMessages.push({
          id: doc.id,
          text: data.text,
          sender: data.sender,
          senderEmail: data.senderEmail,
          timestamp: data.timestamp?.toDate() || new Date(),
          edited: data.edited || false,
          editedAt: data.editedAt?.toDate(),
          deleted: data.deleted || false,
          deletedAt: data.deletedAt?.toDate(),
          deletedBy: data.deletedBy,
          moderated: data.moderated || false,
          moderatedBy: data.moderatedBy,
          moderatedAt: data.moderatedAt?.toDate(),
          reactions: data.reactions || []
        })
      })

      setMessages(prev => [...newMessages.reverse(), ...prev])
      setHasMore(snapshot.docs.length === MESSAGES_PER_PAGE)
      
      if (snapshot.docs.length > 0) {
        setLastMessage(snapshot.docs[snapshot.docs.length - 1])
      }
    } catch (err) {
      console.error('Error loading more messages:', err)
      setError('Failed to load more messages')
    }
  }, [hasMore, lastMessage, enabled])

  return {
    messages,
    loading,
    error,
    hasMore,
    typingUsers: [], // TODO: Implement typing indicators
    reactions: {}, // TODO: Implement reactions
    sendMessage,
    deleteMessage,
    editMessage,
    reactToMessage,
    loadMoreMessages
  }
} 