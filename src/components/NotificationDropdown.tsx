'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { API_BASE } from '@/lib/config'

type Notification = {
  id: number
  message: string
  link: string
  isRead: number
  createdAt: string
}

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const prevCountRef = useRef(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const fetchNotifications = async () => {
      const res = await fetch(`${API_BASE}/notifications`, {
        credentials: 'include'
      })
      const data = await res.json()

      if (data.length > prevCountRef.current) {
        if (audioRef.current) audioRef.current.play()
        toast('🔔 New trade alert!')
      }

      prevCountRef.current = data.length
      setNotifications(data)
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleMarkRead = async (id: number) => {
    await fetch(`${API_BASE}/notifications/${id}/mark-read`, {
      method: 'POST',
      credentials: 'include',
    })
    setNotifications(notifications.filter((n) => n.id !== id))
  }

  return (
    <div className="relative inline-block text-left z-50">
      <audio ref={audioRef} src="/notify.mp3" preload="auto" />

      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-full hover:bg-gray-700 transition"
      >
        🔔
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden ring-1 ring-black ring-opacity-5">
          <Tabs notifications={notifications} handleMarkRead={handleMarkRead} />
        </div>
      )}
    </div>
  )
}

function Tabs({
  notifications,
  handleMarkRead
}: {
  notifications: Notification[]
  handleMarkRead: (id: number) => void
}) {
  const [tab, setTab] = useState<'unread' | 'all'>('unread')
  const [all, setAll] = useState<Notification[]>([])

  useEffect(() => {
    if (tab === 'all') {
      fetch(`${API_BASE}/notifications?unread=false`, {
        credentials: 'include'
      })
        .then((res) => res.json())
        .then(setAll)
    }
  }, [tab])

  const list = tab === 'unread' ? notifications : all

  return (
    <>
      <div className="flex border-b dark:border-gray-700">
        <button
          onClick={() => setTab('unread')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            tab === 'unread' ? 'bg-gray-200 dark:bg-gray-700' : ''
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => setTab('all')}
          className={`flex-1 px-4 py-2 text-sm font-medium ${
            tab === 'all' ? 'bg-gray-200 dark:bg-gray-700' : ''
          }`}
        >
          All
        </button>
      </div>
      {list.length === 0 ? (
        <p className="p-4 text-sm text-gray-500 dark:text-gray-300">No notifications</p>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {list.map((notification) => (
            <li key={notification.id}>
              <Link
                href={notification.link}
                onClick={() => handleMarkRead(notification.id)}
                className="block px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <p className="text-sm text-gray-800 dark:text-gray-200">{notification.message}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(notification.createdAt).toLocaleString()}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
