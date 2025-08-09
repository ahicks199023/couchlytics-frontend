'use client'

import React, { useState, useEffect } from 'react'
import { ChatMessage } from '@/types/chat'

interface ChatAnalyticsProps {
  messages: ChatMessage[]
  chatType: 'league' | 'global' | 'direct'
  isAdmin?: boolean
}

interface AnalyticsData {
  totalMessages: number
  activeUsers: number
  messagesToday: number
  messagesThisWeek: number
  averageMessagesPerUser: number
  mostActiveHour: number
  topEmojis: Array<{ emoji: string; count: number }>
  userActivity: Array<{ user: string; messageCount: number }>
}

export default function ChatAnalytics({ messages, isAdmin = false }: ChatAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d')

  useEffect(() => {
    if (!messages.length) return

    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    let filteredMessages = messages
    switch (timeRange) {
      case '24h':
        filteredMessages = messages.filter(msg => msg.timestamp >= oneDayAgo)
        break
      case '7d':
        filteredMessages = messages.filter(msg => msg.timestamp >= oneWeekAgo)
        break
      case '30d':
        filteredMessages = messages.filter(msg => msg.timestamp >= thirtyDaysAgo)
        break
    }

    // Calculate analytics
    const uniqueUsers = new Set(filteredMessages.map(msg => msg.senderEmail))
    const userActivity = Array.from(uniqueUsers).map(user => ({
      user,
      messageCount: filteredMessages.filter(msg => msg.senderEmail === user).length
    })).sort((a, b) => b.messageCount - a.messageCount)

    // Count emojis from reactions
    const emojiCounts: Record<string, number> = {}
    filteredMessages.forEach(msg => {
      msg.reactions?.forEach(reaction => {
        emojiCounts[reaction.emoji] = (emojiCounts[reaction.emoji] || 0) + reaction.count
      })
    })

    const topEmojis = Object.entries(emojiCounts)
      .map(([emoji, count]) => ({ emoji, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Find most active hour
    const hourCounts = new Array(24).fill(0)
    filteredMessages.forEach(msg => {
      const hour = msg.timestamp.getHours()
      hourCounts[hour]++
    })
    const mostActiveHour = hourCounts.indexOf(Math.max(...hourCounts))

    const analyticsData: AnalyticsData = {
      totalMessages: filteredMessages.length,
      activeUsers: uniqueUsers.size,
      messagesToday: messages.filter(msg => msg.timestamp >= oneDayAgo).length,
      messagesThisWeek: messages.filter(msg => msg.timestamp >= oneWeekAgo).length,
      averageMessagesPerUser: uniqueUsers.size > 0 ? filteredMessages.length / uniqueUsers.size : 0,
      mostActiveHour,
      topEmojis,
      userActivity: userActivity.slice(0, 10) // Top 10 users
    }

    setAnalytics(analyticsData)
  }, [messages, timeRange])

  if (!isAdmin) return null
  if (!analytics) return <div className="text-gray-400">Loading analytics...</div>

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">📊 Chat Analytics</h3>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as '24h' | '7d' | '30d')}
          className="bg-gray-700 text-white text-sm rounded px-2 py-1"
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-2xl font-bold text-white">{analytics.totalMessages}</div>
          <div className="text-gray-400 text-sm">Total Messages</div>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-2xl font-bold text-white">{analytics.activeUsers}</div>
          <div className="text-gray-400 text-sm">Active Users</div>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-2xl font-bold text-white">{analytics.messagesToday}</div>
          <div className="text-gray-400 text-sm">Today</div>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-2xl font-bold text-white">{analytics.averageMessagesPerUser.toFixed(1)}</div>
          <div className="text-gray-400 text-sm">Avg/User</div>
        </div>
      </div>

      {/* Top Users */}
      <div className="mb-6">
        <h4 className="text-white font-medium mb-3">👥 Most Active Users</h4>
        <div className="space-y-2">
          {analytics.userActivity.map((user, index) => (
            <div key={user.user} className="flex items-center justify-between bg-gray-700 p-2 rounded">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm">#{index + 1}</span>
                <span className="text-white text-sm">{user.user.split('@')[0]}</span>
              </div>
              <span className="text-blue-400 text-sm">{user.messageCount} messages</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Emojis */}
      {analytics.topEmojis.length > 0 && (
        <div className="mb-6">
          <h4 className="text-white font-medium mb-3">😀 Most Used Reactions</h4>
          <div className="flex flex-wrap gap-2">
            {analytics.topEmojis.map(({ emoji, count }) => (
              <div key={emoji} className="bg-gray-700 px-3 py-2 rounded flex items-center space-x-2">
                <span className="text-lg">{emoji}</span>
                <span className="text-white text-sm">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Heatmap */}
      <div>
        <h4 className="text-white font-medium mb-3">🕐 Activity by Hour</h4>
        <div className="grid grid-cols-12 gap-1">
          {Array.from({ length: 24 }, (_, hour) => {
            const messageCount = messages.filter(msg => {
              const msgHour = msg.timestamp.getHours()
              return msgHour === hour
            }).length
            const intensity = Math.min(messageCount / 10, 1) // Normalize to 0-1
            return (
              <div
                key={hour}
                className="h-8 rounded text-xs flex items-center justify-center"
                style={{
                  backgroundColor: `rgba(59, 130, 246, ${intensity})`,
                  color: intensity > 0.5 ? 'white' : 'rgb(156 163 175)'
                }}
                title={`${hour}:00 - ${messageCount} messages`}
              >
                {hour}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
} 