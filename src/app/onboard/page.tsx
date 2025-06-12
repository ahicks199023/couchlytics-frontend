'use client'

import LeagueOnboardingForm from '@/components/LeagueOnboardingForm'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function OnboardPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen p-6">
        <LeagueOnboardingForm />
      </div>
    </ProtectedRoute>
  )
}
