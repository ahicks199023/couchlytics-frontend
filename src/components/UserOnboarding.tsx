'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingData } from '../types/user'
import { CheckCircle, ArrowRight, ArrowLeft, User, Shield, Users, Settings } from 'lucide-react'

const steps = [
  { id: 'welcome', title: 'Welcome', icon: Shield },
  { id: 'profile', title: 'Profile', icon: User },
  { id: 'league', title: 'League', icon: Users },
  { id: 'team', title: 'Team', icon: Shield },
  { id: 'preferences', title: 'Preferences', icon: Settings },
  { id: 'complete', title: 'Complete', icon: CheckCircle }
]

export default function UserOnboarding() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<OnboardingData['step']>('welcome')
  const [data, setData] = useState<OnboardingData>({
    step: 'welcome',
    profile: { firstName: '', lastName: '' },
    league: { name: '' },
    team: { name: '', city: '' },
    preferences: {
      theme: 'auto',
      notifications: {
        email: true,
        push: true,
        tradeAlerts: true,
        leagueUpdates: true
      }
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateData = <K extends keyof Omit<OnboardingData, 'step'>>(section: K, updates: Partial<OnboardingData[K]>) => {
    setData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates }
    }))
  }

  const nextStep = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id as OnboardingData['step'])
    }
  }

  const prevStep = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id as OnboardingData['step'])
    }
  }

  const handleComplete = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/onboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        const errorData = await response.json()
        setError(errorData.message || 'Onboarding failed')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold">Welcome to Couchlytics</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Let&apos;s get your Madden league set up in just a few minutes. 
              We&apos;ll help you configure everything you need to manage your league effectively.
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Trade analysis and suggestions</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Player and team analytics</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>League management tools</span>
              </div>
            </div>
          </div>
        )

      case 'profile':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Tell us about yourself</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  value={data.profile.firstName}
                  onChange={(e) => updateData('profile', { firstName: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  value={data.profile.lastName}
                  onChange={(e) => updateData('profile', { lastName: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your last name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Phone (Optional)</label>
              <input
                type="tel"
                value={data.profile.phone || ''}
                onChange={(e) => updateData('profile', { phone: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Timezone</label>
              <select
                value={data.profile.timezone || ''}
                onChange={(e) => updateData('profile', { timezone: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select your timezone</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>
          </div>
        )

      case 'league':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">League Information</h2>
            <div>
              <label className="block text-sm font-medium mb-2">League Name</label>
              <input
                type="text"
                value={data.league.name}
                onChange={(e) => updateData('league', { name: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your league name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Madden Companion App League ID (Optional)</label>
              <input
                type="text"
                value={data.league.externalId || ''}
                onChange={(e) => updateData('league', { externalId: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your league ID from the companion app"
              />
              <p className="text-sm text-gray-500 mt-1">
                This helps us sync data from your Madden companion app
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Commissioner Email</label>
              <input
                type="email"
                value={data.league.commissionerEmail || ''}
                onChange={(e) => updateData('league', { commissionerEmail: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter commissioner email"
              />
            </div>
          </div>
        )

      case 'team':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Your Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Team Name</label>
                <input
                  type="text"
                  value={data.team.name}
                  onChange={(e) => updateData('team', { name: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your team name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">City</label>
                <input
                  type="text"
                  value={data.team.city}
                  onChange={(e) => updateData('team', { city: e.target.value })}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your team city"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Team Abbreviation (Optional)</label>
              <input
                type="text"
                value={data.team.abbreviation || ''}
                onChange={(e) => updateData('team', { abbreviation: e.target.value })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., NE, DAL, GB"
                maxLength={3}
              />
            </div>
          </div>
        )

      case 'preferences':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Preferences</h2>
            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <select
                value={data.preferences.theme}
                onChange={(e) => updateData('preferences', { theme: e.target.value as 'light' | 'dark' | 'auto' })}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto">Auto (System)</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Notifications</label>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={data.preferences.notifications.email}
                    onChange={(e) => updateData('preferences', { 
                      notifications: { ...data.preferences.notifications, email: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <span>Email notifications</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={data.preferences.notifications.push}
                    onChange={(e) => updateData('preferences', { 
                      notifications: { ...data.preferences.notifications, push: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <span>Push notifications</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={data.preferences.notifications.tradeAlerts}
                    onChange={(e) => updateData('preferences', { 
                      notifications: { ...data.preferences.notifications, tradeAlerts: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <span>Trade alerts</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={data.preferences.notifications.leagueUpdates}
                    onChange={(e) => updateData('preferences', { 
                      notifications: { ...data.preferences.notifications, leagueUpdates: e.target.checked }
                    })}
                    className="rounded"
                  />
                  <span>League updates</span>
                </label>
              </div>
            </div>
          </div>
        )

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold">Setup Complete!</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Your Couchlytics account is ready. You can now start managing your Madden league with powerful analytics and trade tools.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto">
              <h3 className="font-semibold mb-2">Summary:</h3>
              <p><strong>Name:</strong> {data.profile.firstName} {data.profile.lastName}</p>
              <p><strong>League:</strong> {data.league.name}</p>
              <p><strong>Team:</strong> {data.team.city} {data.team.name}</p>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'welcome':
        return true
      case 'profile':
        return data.profile.firstName && data.profile.lastName
      case 'league':
        return data.league.name
      case 'team':
        return data.team.name && data.team.city
      case 'preferences':
        return true
      case 'complete':
        return true
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8">
        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = step.id === currentStep
            const isCompleted = steps.findIndex(s => s.id === currentStep) > index
            
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center mb-2
                  ${isActive ? 'bg-blue-600 text-white' : 
                    isCompleted ? 'bg-green-500 text-white' : 
                    'bg-gray-200 text-gray-500'}
                `}>
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs ${isActive ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                  {step.title}
                </span>
              </div>
            )
          })}
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {renderStep()}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 'welcome'}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {currentStep === 'complete' ? (
            <button
              onClick={handleComplete}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Setting up...' : 'Get Started'}
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
} 
