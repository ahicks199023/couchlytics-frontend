'use client'

import { useState } from 'react'
import { toast } from 'sonner'

export default function RecalculateButton() {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/admin/recalculate-values`, {
        method: 'POST',
        credentials: 'include'
      })

      const data = await res.json()
      if (res.ok) {
        toast.success(`✅ ${data.updated} player values recalculated`)
      } else {
        toast.error(data.error || 'Recalculation failed')
      }
    } catch {
      toast.error('Server error during recalculation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
    >
      {loading ? 'Recalculating...' : 'Recalculate Player Values'}
    </button>
  )
}

