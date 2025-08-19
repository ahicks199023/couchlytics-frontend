'use client'

import { useState } from 'react'
import { API_BASE } from '@/lib/config'

export default function UploadLeague() {
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null)
    setStatus('')
  }

  const handleUpload = async () => {
    if (!file) return

    setLoading(true)
    setStatus('Uploading...')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        credentials: 'include',
        method: 'POST',
        body: formData,
      })

      const result = await res.json()

      if (res.ok) {
        setStatus(`✅ Success: ${result.type || 'unknown'} file uploaded.`)
      } else {
        setStatus(`❌ Error: ${result.error || 'Upload failed.'}`)
      }
    } catch {
      setStatus('❌ Upload error. Check network or server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 rounded-xl shadow bg-white dark:bg-zinc-900 max-w-xl mx-auto space-y-4">
      <h2 className="text-xl font-bold">Upload Companion App File</h2>

      <input
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="block w-full border rounded px-3 py-2 text-sm"
      />

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Uploading...' : 'Upload'}
      </button>

      {status && <p className="text-sm mt-2">{status}</p>}
    </div>
  )
}
