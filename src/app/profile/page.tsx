'use client'

import { useEffect, useState } from 'react'
import { API_BASE } from '@/lib/config'

export default function ProfilePage() {
  const [user, setUser] = useState<{
    id: number
    email: string
    isAdmin: boolean
    isCommissioner: boolean
    isPremium: boolean
  } | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/me`, { credentials: 'include' })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          setUser({
            id: data.id,
            email: data.email,
            isAdmin: data.isAdmin,
            isCommissioner: data.isCommissioner,
            isPremium: data.isPremium
          })
        }
      })
  }, [])

  if (!user) {
    return <p className="p-6 text-white">Loading profile...</p>
  }

  return (
    <main className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl font-bold mb-4">Your Profile</h1>
      <div className="bg-gray-800 p-6 rounded-lg space-y-2">
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>Admin:</strong> {user.isAdmin ? 'Yes' : 'No'}</p>
        <p><strong>Commissioner:</strong> {user.isCommissioner ? 'Yes' : 'No'}</p>
        <p><strong>Premium:</strong> {user.isPremium ? 'Yes' : 'No'}</p>
      </div>
    </main>
  )
}
