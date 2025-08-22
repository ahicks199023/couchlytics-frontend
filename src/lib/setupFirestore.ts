import { db } from './firebase'
import { doc, setDoc } from 'firebase/firestore'

/**
 * Setup Firestore documents for chat functionality
 * This creates the necessary league membership documents that the security rules require
 */
export async function setupFirestoreForChat(userId: string, userEmail: string, leagueId: string) {
  if (!db) {
    console.error('❌ Firestore not initialized')
    return false
  }
  
  try {
    console.log('🔧 Setting up Firestore documents for chat...')
    
    // 1. Create league document
    const leagueRef = doc(db, 'leagues', leagueId)
    await setDoc(leagueRef, {
      leagueId,
      name: `League ${leagueId}`,
      createdAt: new Date(),
      isActive: true
    }, { merge: true })
    
    // 2. Create league member document (required by security rules)
    const memberRef = doc(db, 'leagues', leagueId, 'members', userId)
    await setDoc(memberRef, {
      userId,
      email: userEmail,
      joinedAt: new Date(),
      isActive: true,
      role: 'member'
    }, { merge: true })
    
    // 3. Create league commissioner document (for admin permissions)
    const commissionerRef = doc(db, 'leagues', leagueId, 'commissioners', userId)
    await setDoc(commissionerRef, {
      userId,
      email: userEmail,
      appointedAt: new Date(),
      isActive: true
    }, { merge: true })
    
    console.log('✅ Firestore documents created successfully')
    return true
  } catch (error) {
    console.error('❌ Error setting up Firestore documents:', error)
    return false
  }
}

/**
 * Setup global chat documents
 */
export async function setupGlobalChat() {
  if (!db) {
    console.error('❌ Firestore not initialized')
    return false
  }
  
  try {
    console.log('🔧 Setting up global chat documents...')
    
    // Create global chat collection document
    const globalChatRef = doc(db, 'globalChat', 'info')
    await setDoc(globalChatRef, {
      name: 'Global Chat',
      description: 'Chat for all Couchlytics users',
      createdAt: new Date(),
      isActive: true
    }, { merge: true })
    
    console.log('✅ Global chat documents created successfully')
    return true
  } catch (error) {
    console.error('❌ Error setting up global chat documents:', error)
    return false
  }
}

/**
 * Complete Firestore setup for a user
 */
export async function completeFirestoreSetup(userId: string, userEmail: string, leagueId: string) {
  try {
    console.log('🚀 Starting complete Firestore setup...')
    
    // Setup league membership
    const leagueSetup = await setupFirestoreForChat(userId, userEmail, leagueId)
    
    // Setup global chat
    const globalSetup = await setupGlobalChat()
    
    if (leagueSetup && globalSetup) {
      console.log('✅ Complete Firestore setup successful')
      return true
    } else {
      console.error('❌ Some Firestore setup steps failed')
      return false
    }
  } catch (error) {
    console.error('❌ Error during complete Firestore setup:', error)
    return false
  }
} 