'use client'

import React, { useEffect, useState } from 'react'

interface NotificationSystemProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
}

export default function NotificationSystem({ enabled, onToggle }: NotificationSystemProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported('Notification' in window)
    
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if (!('Notification' in window)) return

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result === 'granted') {
        onToggle(true)
        // Show a test notification
        new Notification('Couchlytics Chat', {
          body: 'Notifications enabled! You\'ll be notified of new messages.',
          icon: '/favicon.ico'
        })
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
    }
  }

  const sendTestNotification = () => {
    if (permission === 'granted') {
      new Notification('Couchlytics Chat', {
        body: 'This is a test notification from your chat system!',
        icon: '/favicon.ico',
        tag: 'test-notification'
      })
    }
  }

  if (!isSupported) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
        <div className="text-yellow-400 text-sm">
          ⚠️ Push notifications are not supported in this browser
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">🔔 Notification Settings</h3>
      
      <div className="space-y-3">
        {/* Permission Status */}
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Permission Status:</span>
          <span className={`text-sm px-2 py-1 rounded ${
            permission === 'granted' ? 'bg-green-600 text-white' :
            permission === 'denied' ? 'bg-red-600 text-white' :
            'bg-yellow-600 text-white'
          }`}>
            {permission === 'granted' ? '✅ Granted' :
             permission === 'denied' ? '❌ Denied' :
             '⏳ Default'}
          </span>
        </div>

        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Enable Notifications:</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enabled && permission === 'granted'}
              onChange={(e) => {
                if (e.target.checked && permission !== 'granted') {
                  requestPermission()
                } else {
                  onToggle(e.target.checked)
                }
              }}
              disabled={permission === 'denied'}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {permission === 'default' && (
            <button
              onClick={requestPermission}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Request Permission
            </button>
          )}
          
          {permission === 'granted' && enabled && (
            <button
              onClick={sendTestNotification}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
            >
              Test Notification
            </button>
          )}
          
          {permission === 'denied' && (
            <button
              onClick={() => window.open('chrome://settings/content/notifications', '_blank')}
              className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 transition-colors"
            >
              Open Browser Settings
            </button>
          )}
        </div>

        {/* Help Text */}
        <div className="text-gray-400 text-xs">
          {permission === 'default' && 'Click "Request Permission" to enable notifications'}
          {permission === 'denied' && 'Notifications are blocked. Please enable them in your browser settings.'}
          {permission === 'granted' && enabled && 'You\'ll receive notifications for new messages'}
          {permission === 'granted' && !enabled && 'Notifications are disabled. Toggle to enable.'}
        </div>
      </div>
    </div>
  )
} 