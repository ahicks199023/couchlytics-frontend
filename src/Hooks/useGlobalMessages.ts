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
  DocumentSnapshot
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { GlobalChatMessage, SendMessageParams, UseChatReturn } from '@/types/chat'

const MESSAGES_PER_PAGE = 50

export default function useGlobalMessages(): UseChatReturn {
  const [messages, setMessages] = useState<GlobalChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [lastMessage, setLastMessage] = useState<DocumentSnapshot | null>(null)

  // Load initial messages
  useEffect(() => {
    setLoading(true)
    setError(null)

    const messagesRef = collection(db, 'globalChat', 'messages')
    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limit(MESSAGES_PER_PAGE)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newMessages: GlobalChatMessage[] = []
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
            moderatedAt: data.moderatedAt?.toDate()
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
        setError('Failed to load messages')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const sendMessage = useCallback(async ({ text, sender, senderEmail }: SendMessageParams) => {
    if (!text.trim()) return

    try {
      const messagesRef = collection(db, 'globalChat', 'messages')
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
  }, [])

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const messageRef = doc(db, 'globalChat', 'messages', messageId)
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
    if (!newText.trim()) return

    try {
      const messageRef = doc(db, 'globalChat', 'messages', messageId)
      await updateDoc(messageRef, {
        text: newText.trim(),
        edited: true,
        editedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error editing message:', err)
      setError('Failed to edit message')
    }
  }, [])

  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || !lastMessage) return

    try {
      const messagesRef = collection(db, 'globalChat', 'messages')
      const q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        startAfter(lastMessage),
        limit(MESSAGES_PER_PAGE)
      )

      const snapshot = await getDocs(q)
      const newMessages: GlobalChatMessage[] = []
      
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
          moderatedAt: data.moderatedAt?.toDate()
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
  }, [hasMore, lastMessage])

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