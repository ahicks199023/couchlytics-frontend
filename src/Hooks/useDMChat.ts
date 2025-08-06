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
  getDocs
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DirectMessage, SendMessageParams, UseChatReturn } from '@/types/chat'
import { generateConversationId } from '@/lib/chatUtils'

const MESSAGES_PER_PAGE = 50

export const useDMChat = (currentUserEmail: string, recipientEmail: string): UseChatReturn => {
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [lastMessage, setLastMessage] = useState<any>(null)

  const conversationId = generateConversationId(currentUserEmail, recipientEmail)

  // Load initial messages
  useEffect(() => {
    if (!currentUserEmail || !recipientEmail) return

    setLoading(true)
    setError(null)

    const messagesRef = collection(db, 'privateMessages', conversationId, 'messages')
    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limit(MESSAGES_PER_PAGE)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newMessages: DirectMessage[] = []
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
            conversationId: data.conversationId,
            recipient: data.recipient
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
        console.error('Error loading DM messages:', err)
        setError('Failed to load messages')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [currentUserEmail, recipientEmail, conversationId])

  const sendMessage = useCallback(async ({ text, sender, senderEmail }: SendMessageParams) => {
    if (!text.trim() || !currentUserEmail || !recipientEmail) return

    try {
      const messagesRef = collection(db, 'privateMessages', conversationId, 'messages')
      await addDoc(messagesRef, {
        text: text.trim(),
        sender,
        senderEmail,
        timestamp: serverTimestamp(),
        conversationId,
        recipient: recipientEmail
      })
    } catch (err) {
      console.error('Error sending DM:', err)
      setError('Failed to send message')
    }
  }, [currentUserEmail, recipientEmail, conversationId])

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!currentUserEmail || !recipientEmail) return

    try {
      const messageRef = doc(db, 'privateMessages', conversationId, 'messages', messageId)
      await updateDoc(messageRef, {
        deleted: true,
        deletedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error deleting DM:', err)
      setError('Failed to delete message')
    }
  }, [currentUserEmail, recipientEmail, conversationId])

  const editMessage = useCallback(async (messageId: string, newText: string) => {
    if (!newText.trim() || !currentUserEmail || !recipientEmail) return

    try {
      const messageRef = doc(db, 'privateMessages', conversationId, 'messages', messageId)
      await updateDoc(messageRef, {
        text: newText.trim(),
        edited: true,
        editedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error editing DM:', err)
      setError('Failed to edit message')
    }
  }, [currentUserEmail, recipientEmail, conversationId])

  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || !lastMessage || !currentUserEmail || !recipientEmail) return

    try {
      const messagesRef = collection(db, 'privateMessages', conversationId, 'messages')
      const q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        startAfter(lastMessage),
        limit(MESSAGES_PER_PAGE)
      )

      const snapshot = await getDocs(q)
      const newMessages: DirectMessage[] = []
      
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
          conversationId: data.conversationId,
          recipient: data.recipient
        })
      })

      setMessages(prev => [...newMessages.reverse(), ...prev])
      setHasMore(snapshot.docs.length === MESSAGES_PER_PAGE)
      
      if (snapshot.docs.length > 0) {
        setLastMessage(snapshot.docs[snapshot.docs.length - 1])
      }
    } catch (err) {
      console.error('Error loading more DMs:', err)
      setError('Failed to load more messages')
    }
  }, [hasMore, lastMessage, currentUserEmail, recipientEmail, conversationId])

  return {
    messages,
    loading,
    error,
    hasMore,
    sendMessage,
    deleteMessage,
    editMessage,
    loadMoreMessages
  }
} 