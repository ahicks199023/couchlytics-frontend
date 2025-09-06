'use client'

import React, { useState } from 'react'
import { db, auth } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, getDocs, query, limit } from 'firebase/firestore'

interface FirebaseTestProps {
  leagueId: string
}

export default function FirebaseTest({ leagueId }: FirebaseTestProps) {
  const [testResult, setTestResult] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const testFirebaseConnection = async () => {
    setIsLoading(true)
    setTestResult('')
    
    try {
      console.log('🧪 Testing Firebase connection...')
      
      // Test 1: Check Firebase initialization
      if (!db) {
        throw new Error('Firestore database not initialized')
      }
      console.log('✅ Firestore database initialized')
      
      // Test 2: Check authentication
      if (!auth || !auth.currentUser) {
        throw new Error('User not authenticated')
      }
      console.log('✅ User authenticated:', auth.currentUser.uid)
      
      // Test 3: Test Firestore write permission
      console.log('🧪 Testing Firestore write permission...')
      const testRef = collection(db, 'leagueChats', leagueId, 'messages')
      const testDoc = await addDoc(testRef, {
        text: 'Firebase connection test message',
        sender: 'Test User',
        senderEmail: auth.currentUser.email || 'test@example.com',
        timestamp: serverTimestamp(),
        leagueId,
        moderated: false,
        isTest: true
      })
      console.log('✅ Firestore write successful, document ID:', testDoc.id)
      
      // Test 4: Test Firestore read permission
      console.log('🧪 Testing Firestore read permission...')
      const readQuery = query(testRef, limit(1))
      const snapshot = await getDocs(readQuery)
      console.log('✅ Firestore read successful, found', snapshot.size, 'documents')
      
      setTestResult('✅ All Firebase tests passed! Chat should be working.')
      
    } catch (error) {
      console.error('❌ Firebase test failed:', error)
      setTestResult(`❌ Firebase test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const testFirestoreRules = async () => {
    setIsLoading(true)
    setTestResult('')
    
    try {
      console.log('🧪 Testing Firestore security rules...')
      
      if (!db || !auth?.currentUser) {
        throw new Error('Firebase not properly initialized')
      }
      
      // Try to read from the chat collection
      const chatRef = collection(db, 'leagueChats', leagueId, 'messages')
      const readQuery = query(chatRef, limit(5))
      const snapshot = await getDocs(readQuery)
      
      console.log('✅ Firestore rules test passed - can read chat messages')
      setTestResult(`✅ Firestore rules test passed! Found ${snapshot.size} messages in chat.`)
      
    } catch (error) {
      console.error('❌ Firestore rules test failed:', error)
      const errorCode = (error as { code?: string })?.code
      if (errorCode === 'permission-denied') {
        setTestResult('❌ Permission denied - Firestore security rules may be blocking access')
      } else {
        setTestResult(`❌ Firestore rules test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold mb-3">🧪 Firebase Debug Tools</h3>
      
      <div className="space-y-3">
        <div className="flex space-x-2">
          <button
            onClick={testFirebaseConnection}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600"
          >
            {isLoading ? 'Testing...' : 'Test Firebase Connection'}
          </button>
          
          <button
            onClick={testFirestoreRules}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-600"
          >
            {isLoading ? 'Testing...' : 'Test Firestore Rules'}
          </button>
        </div>
        
        {testResult && (
          <div className={`p-3 rounded text-sm ${
            testResult.includes('✅') ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
          }`}>
            {testResult}
          </div>
        )}
        
        <div className="text-xs text-gray-400">
          <p><strong>Current State:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Firebase DB: {db ? '✅ Initialized' : '❌ Not initialized'}</li>
            <li>Firebase Auth: {auth ? '✅ Initialized' : '❌ Not initialized'}</li>
            <li>Current User: {auth?.currentUser ? '✅ Authenticated' : '❌ Not authenticated'}</li>
            <li>League ID: {leagueId || '❌ Missing'}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
