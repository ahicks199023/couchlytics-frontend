'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useAuth from '@/Hooks/useAuth'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const { loading: authLoading, isAdmin, isCommissioner } = useAuth()

  const isAuthorized = isAdmin() || isCommissioner()

  if (!authLoading && !isAuthorized) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <p className="text-red-400">Access denied: Admins or Commissioners only</p>
      </main>
    )
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file first.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Upload failed')
      } else {
        setMessage(data.message || 'Upload successful')
        setTimeout(() => router.push('/admin/upload-logs'), 1500)
      }
    } catch (err) {
      console.error(err)
      setError('Upload failed due to network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-neon-green mb-6">Upload League JSON</h1>

        {message && <div className="bg-green-600 text-white px-4 py-2 mb-4 rounded">{message}</div>}
        {error && <div className="bg-red-600 text-white px-4 py-2 mb-4 rounded">{error}</div>}

        <form onSubmit={handleUpload} className="space-y-4 bg-gray-800 p-6 rounded">
          <input
            type="file"
            accept=".json"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="bg-gray-100 text-black p-2 rounded w-full"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-neon-green text-black font-semibold px-4 py-2 rounded hover:bg-lime-400 disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>
    </main>
  )
}
