'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Email and password are required.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await res.json()
      if (res.ok) {
        router.push('/login')
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (err: any) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <form
        onSubmit={handleRegister}
        className="bg-gray-900 p-8 rounded shadow-md w-full max-w-sm space-y-5"
      >
        <h1 className="text-2xl font-bold text-neon-green text-center">Register</h1>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded font-semibold transition ${
            loading
              ? 'bg-gray-700 cursor-not-allowed text-gray-400'
              : 'bg-neon-green text-black hover:bg-lime-400'
          }`}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>

        <p className="text-sm text-gray-400 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-neon-green hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </main>
  )
}
