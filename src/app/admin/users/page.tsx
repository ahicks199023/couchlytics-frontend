'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type User = {
  id: number
  email: string
  isAdmin: boolean
  isPremium: boolean
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [filtered, setFiltered] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [filterAdmin, setFilterAdmin] = useState('all')
  const [filterPremium, setFilterPremium] = useState('all')
  const [toast, setToast] = useState<string | null>(null)

  // ✅ Admin check — redirect if not admin
  useEffect(() => {
    fetch('http://localhost:5000/me', { credentials: 'include' })
      .then((res) => res.ok ? res.json() : null)
      .then((user) => {
        if (!user?.is_admin) {
          router.push('/')
        }
      })
      .catch(() => router.push('/'))
  }, [])

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  const fetchUsers = async () => {
    const res = await fetch('http://localhost:5000/admin/users', {
      credentials: 'include',
    })
    const data = await res.json()
    setUsers(data)
    setFiltered(data)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    let filteredUsers = users

    if (search.trim()) {
      filteredUsers = filteredUsers.filter((u) =>
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (filterAdmin !== 'all') {
      filteredUsers = filteredUsers.filter(
        (u) => u.isAdmin === (filterAdmin === 'true')
      )
    }

    if (filterPremium !== 'all') {
      filteredUsers = filteredUsers.filter(
        (u) => u.isPremium === (filterPremium === 'true')
      )
    }

    setFiltered(filteredUsers)
  }, [search, filterAdmin, filterPremium, users])

  const updatePremium = async (email: string, makePremium: boolean) => {
    const route = `http://localhost:5000/admin/${makePremium ? 'promote' : 'demote'}-user`
    const res = await fetch(route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    })

    if (res.ok) {
      showToast(`${makePremium ? 'Promoted' : 'Demoted'}: ${email}`)
      await fetchUsers()
    } else {
      showToast(`Error: ${res.status}`)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">User Management</h1>

      {toast && (
        <div className="bg-green-600 text-white px-4 py-2 rounded mb-4 w-fit">
          {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 rounded bg-gray-800 border border-gray-600 text-white w-full sm:w-1/3"
        />

        <select
          value={filterAdmin}
          onChange={(e) => setFilterAdmin(e.target.value)}
          className="bg-gray-800 text-white border border-gray-600 px-2 py-2 rounded"
        >
          <option value="all">All Admins</option>
          <option value="true">Admins Only</option>
          <option value="false">Non-Admins</option>
        </select>

        <select
          value={filterPremium}
          onChange={(e) => setFilterPremium(e.target.value)}
          className="bg-gray-800 text-white border border-gray-600 px-2 py-2 rounded"
        >
          <option value="all">All Premium</option>
          <option value="true">Premium Only</option>
          <option value="false">Non-Premium</option>
        </select>
      </div>

      <table className="w-full border border-gray-700 text-sm">
        <thead>
          <tr className="bg-gray-800 text-left">
            <th className="p-2 border-b border-gray-700">Email</th>
            <th className="p-2 border-b border-gray-700">Admin</th>
            <th className="p-2 border-b border-gray-700">Premium</th>
            <th className="p-2 border-b border-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((user) => (
            <tr key={user.id} className="border-b border-gray-700">
              <td className="p-2">{user.email}</td>
              <td className="p-2">{user.isAdmin ? '✅' : '—'}</td>
              <td className="p-2">{user.isPremium ? '✅' : '—'}</td>
              <td className="p-2 space-x-2">
                {user.isPremium ? (
                  <button
                    onClick={() => updatePremium(user.email, false)}
                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs"
                  >
                    Demote
                  </button>
                ) : (
                  <button
                    onClick={() => updatePremium(user.email, true)}
                    className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded text-xs"
                  >
                    Promote
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
