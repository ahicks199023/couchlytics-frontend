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
import { db, auth } from '@/lib/firebase'
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
    console.log('🔍 useGlobalMessages useEffect triggered:', { 
      enabled, 
      db: !!db, 
      auth: !!auth, 
      currentUser: !!auth?.currentUser 
    })
    
    if (!enabled || !db) {
      console.log('❌ Global message loading blocked - missing requirements:', { 
        enabled, 
        db: !!db 
      })
      setLoading(false)
      return
    }

    // Check if user is authenticated before accessing Firestore
    // Note: We'll allow this to proceed even without Firebase auth since we have backend auth
    if (!auth) {
      console.log('❌ Global message loading blocked - Firebase auth not initialized:', { 
        auth: !!auth
      })
      setLoading(false)
      return
    }
    
    // If Firebase user is not authenticated, we'll still try to proceed
    // The Firestore rules will handle the actual permission check
    if (!auth.currentUser) {
      console.log('⚠️ No Firebase user - proceeding with backend auth only')
    } else {
      console.log('✅ Firebase user authenticated:', auth.currentUser.uid)
    }

    console.log('🔍 Starting to load global messages')
    setLoading(true)
    setError(null)

    const messagesRef = collection(db, 'globalChats')
    console.log('🔍 Global messages collection reference:', messagesRef.path)
    
    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limit(MESSAGES_PER_PAGE)
    )
    console.log('🔍 Firestore query created')

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📨 Global Firestore snapshot received:', { 
          size: snapshot.size, 
          empty: snapshot.empty,
          fromCache: snapshot.metadata.fromCache 
        })
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
            reactions: data.reactions || [],
            replyTo: data.replyTo || undefined
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
        console.error('❌ Error loading global chat messages:', err)
        console.error('❌ Error details:', {
          code: (err as { code?: string })?.code,
          message: (err as { message?: string })?.message,
          stack: (err as { stack?: string })?.stack
        })
        const code = (err as { code?: string }).code || ''
        if (code === 'permission-denied') {
          console.error('❌ Permission denied - user may not have access to global chat')
          setError('Missing or insufficient permissions.')
        } else {
          console.error('❌ General error loading global messages')
          setError('Failed to load messages')
        }
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [enabled])

  const sendMessage = useCallback(async ({ text, sender, senderEmail, replyTo }: SendMessageParams) => {
    console.log('🔍 sendGlobalMessage called with:', { text, sender, senderEmail, enabled, db: !!db })
    
    if (!text.trim() || !enabled || !db) {
      console.log('❌ sendGlobalMessage blocked - missing requirements:', { 
        text: !!text.trim(), 
        enabled, 
        db: !!db 
      })
      return
    }

    try {
      console.log('🔍 Creating global message reference...')
      const messagesRef = collection(db, 'globalChats')
      console.log('🔍 Global message reference created:', messagesRef.path)
      
      console.log('🔍 Adding document to Firestore...')
      const docRef = await addDoc(messagesRef, {
        text: text.trim(),
        sender,
        senderEmail,
        timestamp: serverTimestamp(),
        moderated: false,
        replyTo: replyTo || null
      })
      console.log('✅ Global message sent successfully with ID:', docRef.id)
    } catch (err) {
      console.error('❌ Error sending global message:', err)
      console.error('❌ Error details:', {
        code: (err as { code?: string })?.code,
        message: (err as { message?: string })?.message,
        stack: (err as { stack?: string })?.stack
      })
      
      // Check if it's a permission error
      const errorCode = (err as { code?: string })?.code
      if (errorCode === 'permission-denied') {
        setError('Permission denied - you may not have access to global chat')
      } else {
        setError('Failed to send message')
      }
    }
  }, [enabled])

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!enabled || !db) return

    try {
      const messageRef = doc(db, 'globalChats', messageId)
      await updateDoc(messageRef, {
        deleted: true,
        deletedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error deleting global message:', err)
      setError('Failed to delete message')
    }
  }, [enabled])

  const editMessage = useCallback(async (messageId: string, newText: string) => {
    if (!newText.trim() || !enabled || !db) return

    try {
      const messageRef = doc(db, 'globalChats', messageId)
      await updateDoc(messageRef, {
        text: newText.trim(),
        edited: true,
        editedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error editing global message:', err)
      setError('Failed to edit message')
    }
  }, [enabled])

  const reactToMessage = useCallback(async (messageId: string, emoji: string, userEmail: string) => {
    if (!enabled || !db) return

    try {
      const messageRef = doc(db, 'globalChats', messageId)
      const messageDoc = await getDoc(messageRef)
      
      if (!messageDoc.exists()) {
        console.error('Global message not found')
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
      console.error('Error reacting to global message:', err)
      setError('Failed to react to message')
    }
  }, [enabled])

  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || !lastMessage || !enabled || !db) return

    try {
      const messagesRef = collection(db, 'globalChats')
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
          reactions: data.reactions || [],
          replyTo: data.replyTo || undefined
        })
      })

      setMessages(prev => [...newMessages.reverse(), ...prev])
      setHasMore(snapshot.docs.length === MESSAGES_PER_PAGE)
      
      if (snapshot.docs.length > 0) {
        setLastMessage(snapshot.docs[snapshot.docs.length - 1])
      }
    } catch (err) {
      console.error('Error loading more global messages:', err)
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