'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { fetchFromApi } from '@/lib/api'
import { CheckCircle, ArrowRight, ArrowLeft, User, Shield, Users, Settings } from 'lucide-react'

const steps = [
  { id: 'account', title: 'Account', icon: User },
  { id: 'role', title: 'Role', icon: Shield },
  { id: 'league', title: 'League', icon: Users },
  { id: 'team', title: 'Team', icon: Shield },
  { id: 'preferences', title: 'Preferences', icon: Settings },
  { id: 'complete', title: 'Complete', icon: CheckCircle }
]

export default function RegisterPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState('account')
  const [formData, setFormData] = useState({
    // Account fields
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    // Role field
    isCommissioner: false,
    // League fields
    leagueName: '',
    externalId: '',
    commissionerEmail: '',
    // Team fields
    teamName: '',
    teamCity: '',
    teamAbbreviation: '',
    // Preferences
    theme: 'auto',
    emailNotifications: true,
    pushNotifications: true,
    tradeAlerts: true,
    leagueUpdates: true
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 'account':
        if (!formData.firstName.trim()) {
          setError('First name is required')
          return false
        }
        if (!formData.lastName.trim()) {
          setError('Last name is required')
          return false
        }
        if (!formData.email.trim()) {
          setError('Email is required')
          return false
        }
        if (!formData.email.includes('@')) {
          setError('Please enter a valid email address')
          return false
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long')
          return false
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match')
          return false
        }
        break
      case 'role':
        // Role selection is always valid
        break
      case 'league':
        if (formData.isCommissioner && !formData.leagueName.trim()) {
          setError('League name is required for commissioners')
          return false
        }
        break
      case 'team':
        if (formData.isCommissioner && !formData.teamName.trim()) {
          setError('Team name is required for commissioners')
          return false
        }
        if (formData.isCommissioner && !formData.teamCity.trim()) {
          setError('Team city is required for commissioners')
          return false
        }
        break
      case 'preferences':
        // Preferences are optional, so no validation needed
        break
    }
    return true
  }

  const nextStep = () => {
    if (!validateCurrentStep()) return
    
    const currentIndex = steps.findIndex(s => s.id === currentStep)
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id)
    }
  }

  const prevStep = () => {
    const currentIndex = steps.findIndex(s => s.id === currentStep)
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateCurrentStep()) return

    setIsLoading(true)

    try {
      // Prepare the data in the format expected by the backend
      const registrationData = {
        // Account data
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        // Role data
        isCommissioner: formData.isCommissioner,
        // League data (only if commissioner)
        league: formData.isCommissioner ? {
          name: formData.leagueName,
          externalId: formData.externalId || undefined,
          commissionerEmail: formData.commissionerEmail || undefined
        } : undefined,
        // Team data (only if commissioner)
        team: formData.isCommissioner ? {
          name: formData.teamName,
          city: formData.teamCity,
          abbreviation: formData.teamAbbreviation || undefined
        } : undefined,
        // Preferences data
        preferences: {
          theme: formData.theme,
          notifications: {
            email: formData.emailNotifications,
            push: formData.pushNotifications,
            tradeAlerts: formData.tradeAlerts,
            leagueUpdates: formData.leagueUpdates
          }
        }
      }

      // Use the centralized API with credentials; correct endpoint path
      await fetchFromApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify(registrationData)
      })

      router.push('/login?message=Registration successful! Please log in to access your account.')
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message.replace('API error: ', ''))
      } else {
        setError('Registration failed. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'account':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center mb-4">Create Your Account</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1">
                  First Name *
                </label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1">
                  Last Name *
                </label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email Address *
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={handleInputChange}
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password *
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                Confirm Password *
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                required
              />
            </div>
          </div>
        )

      case 'role':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center mb-4">What brings you to Couchlytics?</h2>
            <p className="text-gray-400 text-center mb-6">
              This helps us set up your account with the right permissions and features.
            </p>
            
            <div className="space-y-4">
              <label className="flex items-start space-x-4 p-4 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                <input
                  type="radio"
                  name="isCommissioner"
                  checked={formData.isCommissioner === true}
                  onChange={() => setFormData(prev => ({ ...prev, isCommissioner: true }))}
                  className="mt-1"
                />
                <div>
                  <h3 className="font-semibold text-white">I&apos;m a League Commissioner</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    I run a Madden league and want to manage teams, players, trades, and league settings.
                  </p>
                </div>
              </label>
              
              <label className="flex items-start space-x-4 p-4 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                <input
                  type="radio"
                  name="isCommissioner"
                  checked={formData.isCommissioner === false}
                  onChange={() => setFormData(prev => ({ ...prev, isCommissioner: false }))}
                  className="mt-1"
                />
                <div>
                  <h3 className="font-semibold text-white">I&apos;m a League Member</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    I&apos;m part of a league and want to view stats, analyze trades, and manage my team.
                  </p>
                </div>
              </label>
            </div>
          </div>
        )

      case 'league':
        if (!formData.isCommissioner) {
          return (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center mb-4">Join an Existing League</h2>
              <p className="text-gray-400 text-center mb-6">
                You&apos;ll need to be invited by your league commissioner to join their league.
              </p>
              <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                  <strong>Note:</strong> After registration, contact your league commissioner to get an invitation to join their league.
                </p>
              </div>
            </div>
          )
        }
        
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center mb-4">League Information</h2>
            <div>
              <label htmlFor="leagueName" className="block text-sm font-medium text-gray-300 mb-1">
                League Name *
              </label>
              <Input
                id="leagueName"
                name="leagueName"
                type="text"
                placeholder="My Madden League"
                value={formData.leagueName}
                onChange={handleInputChange}
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                required
              />
            </div>
            <div>
              <label htmlFor="externalId" className="block text-sm font-medium text-gray-300 mb-1">
                Madden Companion App League ID (Optional)
              </label>
              <Input
                id="externalId"
                name="externalId"
                type="text"
                placeholder="Enter your league ID from the companion app"
                value={formData.externalId}
                onChange={handleInputChange}
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
              />
              <p className="text-xs text-gray-500 mt-1">
                This helps us sync data from your Madden companion app
              </p>
            </div>
            <div>
              <label htmlFor="commissionerEmail" className="block text-sm font-medium text-gray-300 mb-1">
                Commissioner Email (Optional)
              </label>
              <Input
                id="commissionerEmail"
                name="commissionerEmail"
                type="email"
                placeholder="commissioner@example.com"
                value={formData.commissionerEmail}
                onChange={handleInputChange}
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
              />
            </div>
          </div>
        )

      case 'team':
        if (!formData.isCommissioner) {
          return (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-center mb-4">Your Team</h2>
              <p className="text-gray-400 text-center mb-6">
                You&apos;ll be able to set up your team once you join a league.
              </p>
              <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                  <strong>Note:</strong> Team information will be configured after you receive an invitation from your league commissioner.
                </p>
              </div>
            </div>
          )
        }
        
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center mb-4">Your Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="teamName" className="block text-sm font-medium text-gray-300 mb-1">
                  Team Name *
                </label>
                <Input
                  id="teamName"
                  name="teamName"
                  type="text"
                  placeholder="Patriots"
                  value={formData.teamName}
                  onChange={handleInputChange}
                  className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                  required
                />
              </div>
              <div>
                <label htmlFor="teamCity" className="block text-sm font-medium text-gray-300 mb-1">
                  City *
                </label>
                <Input
                  id="teamCity"
                  name="teamCity"
                  type="text"
                  placeholder="New England"
                  value={formData.teamCity}
                  onChange={handleInputChange}
                  className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="teamAbbreviation" className="block text-sm font-medium text-gray-300 mb-1">
                Team Abbreviation (Optional)
              </label>
              <Input
                id="teamAbbreviation"
                name="teamAbbreviation"
                type="text"
                placeholder="NE"
                value={formData.teamAbbreviation}
                onChange={handleInputChange}
                className="bg-gray-800 border-gray-600 text-white placeholder:text-gray-400"
                maxLength={3}
              />
            </div>
          </div>
        )

      case 'preferences':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center mb-4">Preferences</h2>
            <div>
              <label htmlFor="theme" className="block text-sm font-medium text-gray-300 mb-1">
                Theme
              </label>
              <select
                id="theme"
                name="theme"
                value={formData.theme}
                onChange={handleInputChange}
                className="w-full p-3 bg-gray-800 border border-gray-600 text-white rounded-md"
              >
                <option value="auto">Auto (System)</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-300">Notifications</h3>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="emailNotifications"
                  checked={formData.emailNotifications}
                  onChange={handleInputChange}
                  className="rounded"
                />
                <span>Email notifications</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="pushNotifications"
                  checked={formData.pushNotifications}
                  onChange={handleInputChange}
                  className="rounded"
                />
                <span>Push notifications</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="tradeAlerts"
                  checked={formData.tradeAlerts}
                  onChange={handleInputChange}
                  className="rounded"
                />
                <span>Trade alerts</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="leagueUpdates"
                  checked={formData.leagueUpdates}
                  onChange={handleInputChange}
                  className="rounded"
                />
                <span>League updates</span>
              </label>
            </div>
          </div>
        )

      case 'complete':
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold">Ready to Create Account!</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Review your information below and click &quot;Create Account&quot; to complete your registration.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto">
              <h3 className="font-semibold mb-2">Summary:</h3>
              <p><strong>Name:</strong> {formData.firstName} {formData.lastName}</p>
              <p><strong>Email:</strong> {formData.email}</p>
              <p><strong>Role:</strong> {formData.isCommissioner ? 'Commissioner' : 'League Member'}</p>
              {formData.isCommissioner && (
                <>
                  <p><strong>League:</strong> {formData.leagueName}</p>
                  <p><strong>Team:</strong> {formData.teamCity} {formData.teamName}</p>
                </>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 'account':
        return formData.firstName && formData.lastName && formData.email && formData.password && formData.password === formData.confirmPassword
      case 'role':
        return formData.isCommissioner !== undefined
      case 'league':
        return !formData.isCommissioner || formData.leagueName
      case 'team':
        return !formData.isCommissioner || (formData.teamName && formData.teamCity)
      case 'preferences':
        return true
      case 'complete':
        return true
      default:
        return false
    }
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-gray-900 border-gray-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-neon-green">
            Create Account
          </CardTitle>
          <p className="text-gray-400 text-sm">
            Join Couchlytics to manage your Madden league
          </p>
          
          {/* Progress Steps */}
          <div className="flex justify-between mt-6">
            {steps.map((step, index) => {
              const Icon = step.icon
              const isActive = step.id === currentStep
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center mb-2
                    ${isActive ? 'bg-neon-green text-black' : 
                      isCompleted ? 'bg-green-500 text-white' : 
                      'bg-gray-600 text-gray-400'}
                  `}>
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-xs ${isActive ? 'text-neon-green font-medium' : 'text-gray-400'}`}>
                    {step.title}
                  </span>
                </div>
              )
            })}
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-900/20 border border-red-500 rounded-md">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Step Content */}
            <div className="min-h-[300px]">
              {renderStep()}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 'account'}
                className="flex items-center space-x-2 px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              {currentStep === 'complete' ? (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-neon-green text-black font-semibold px-6 py-2 rounded-md hover:bg-lime-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="flex items-center space-x-2 bg-neon-green text-black font-semibold px-4 py-2 rounded-md hover:bg-lime-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <a href="/login" className="text-neon-green hover:text-lime-400 transition-colors">
                Sign in
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
