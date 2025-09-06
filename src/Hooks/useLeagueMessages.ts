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
import { LeagueChatMessage, SendMessageParams, UseChatReturn } from '@/types/chat'

const MESSAGES_PER_PAGE = 50

export default function useLeagueMessages(leagueId: string, enabled: boolean = true): UseChatReturn {
  const [messages, setMessages] = useState<LeagueChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [lastMessage, setLastMessage] = useState<DocumentSnapshot | null>(null)

  // Load initial messages
  useEffect(() => {
    console.log('🔍 useLeagueMessages useEffect triggered:', { 
      leagueId, 
      enabled, 
      db: !!db, 
      auth: !!auth, 
      currentUser: !!auth?.currentUser 
    })
    
    if (!leagueId || !enabled || !db) {
      console.log('❌ Message loading blocked - missing requirements:', { 
        leagueId: !!leagueId, 
        enabled, 
        db: !!db 
      })
      setLoading(false)
      return
    }

    // Check if user is authenticated before accessing Firestore
    // Note: We'll allow this to proceed even without Firebase auth since we have backend auth
    if (!auth) {
      console.log('❌ Message loading blocked - Firebase auth not initialized:', { 
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

    console.log('🔍 Starting to load messages for league:', leagueId)
    setLoading(true)
    setError(null)

    const messagesRef = collection(db, 'leagueChats', leagueId, 'messages')
    console.log('🔍 Messages collection reference:', messagesRef.path)
    
    const q = query(
      messagesRef,
      orderBy('timestamp', 'desc'),
      limit(MESSAGES_PER_PAGE)
    )
    console.log('🔍 Firestore query created')

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('📨 Firestore snapshot received:', { 
          size: snapshot.size, 
          empty: snapshot.empty,
          fromCache: snapshot.metadata.fromCache 
        })
        const newMessages: LeagueChatMessage[] = []
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
            leagueId: data.leagueId,
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
        console.error('❌ Error loading league chat messages:', err)
        console.error('❌ Error details:', {
          code: (err as { code?: string })?.code,
          message: (err as { message?: string })?.message,
          stack: (err as { stack?: string })?.stack
        })
        const code = (err as { code?: string }).code || ''
        if (code === 'permission-denied') {
          console.error('❌ Permission denied - user may not have access to this league chat')
          setError('Missing or insufficient permissions.')
        } else {
          console.error('❌ General error loading messages')
          setError('Failed to load messages')
        }
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [leagueId, enabled])

  const sendMessage = useCallback(async ({ text, sender, senderEmail, replyTo }: SendMessageParams) => {
    console.log('🔍 sendMessage called with:', { leagueId, text, sender, senderEmail, enabled, db: !!db })
    
    if (!leagueId || !text.trim() || !enabled || !db) {
      console.log('❌ sendMessage blocked - missing requirements:', { 
        leagueId: !!leagueId, 
        text: !!text.trim(), 
        enabled, 
        db: !!db 
      })
      return
    }

    try {
      console.log('🔍 Creating message reference...')
      const messagesRef = collection(db, 'leagueChats', leagueId, 'messages')
      console.log('🔍 Message reference created:', messagesRef.path)
      
      console.log('🔍 Adding document to Firestore...')
      const docRef = await addDoc(messagesRef, {
        text: text.trim(),
        sender,
        senderEmail,
        timestamp: serverTimestamp(),
        leagueId,
        moderated: false,
        replyTo: replyTo || null
      })
      console.log('✅ Message sent successfully with ID:', docRef.id)
    } catch (err) {
      console.error('❌ Error sending message:', err)
      console.error('❌ Error details:', {
        code: (err as { code?: string })?.code,
        message: (err as { message?: string })?.message,
        stack: (err as { stack?: string })?.stack
      })
      
      // Check if it's a permission error
      const errorCode = (err as { code?: string })?.code
      if (errorCode === 'permission-denied') {
        setError('Permission denied - you may not have access to this league chat')
      } else {
        setError('Failed to send message')
      }
    }
  }, [leagueId, enabled])

  const deleteMessage = useCallback(async (messageId: string) => {
    if (!leagueId || !enabled || !db) return

    try {
      const messageRef = doc(db, 'leagueChats', leagueId, 'messages', messageId)
      await updateDoc(messageRef, {
        deleted: true,
        deletedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error deleting message:', err)
      setError('Failed to delete message')
    }
  }, [leagueId, enabled])

  const editMessage = useCallback(async (messageId: string, newText: string) => {
    if (!leagueId || !newText.trim() || !enabled || !db) return

    try {
      const messageRef = doc(db, 'leagueChats', leagueId, 'messages', messageId)
      await updateDoc(messageRef, {
        text: newText.trim(),
        edited: true,
        editedAt: serverTimestamp()
      })
    } catch (err) {
      console.error('Error editing message:', err)
      setError('Failed to edit message')
    }
  }, [leagueId, enabled])

  const reactToMessage = useCallback(async (messageId: string, emoji: string, userEmail: string) => {
    if (!leagueId || !enabled || !db) return

    try {
      const messageRef = doc(db, 'leagueChats', leagueId, 'messages', messageId)
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
  }, [leagueId, enabled])

  const loadMoreMessages = useCallback(async () => {
    if (!leagueId || !hasMore || !lastMessage || !enabled || !db) return

    try {
      const messagesRef = collection(db, 'leagueChats', leagueId, 'messages')
      const q = query(
        messagesRef,
        orderBy('timestamp', 'desc'),
        startAfter(lastMessage),
        limit(MESSAGES_PER_PAGE)
      )

      const snapshot = await getDocs(q)
      const newMessages: LeagueChatMessage[] = []
      
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
          leagueId: data.leagueId,
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
      console.error('Error loading more messages:', err)
      setError('Failed to load more messages')
    }
  }, [leagueId, hasMore, lastMessage, enabled])

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