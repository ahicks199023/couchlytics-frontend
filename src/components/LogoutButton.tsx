'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/logout`, {
      method: 'POST',
      credentials: 'include'
    })

    if (res.ok) {
      router.push('/login')
    } else {
      alert('Logout failed')
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm text-red-400 hover:text-red-600 border border-red-400 px-3 py-1 rounded ml-4"
    >
      Logout
    </button>
  )
}

