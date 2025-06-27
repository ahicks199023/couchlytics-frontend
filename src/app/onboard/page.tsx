'use client'

import UserOnboarding from '../../components/UserOnboarding'
import ProtectedRoute from '../../components/ProtectedRoute'

export default function OnboardPage() {
  return (
    <ProtectedRoute>
      <UserOnboarding />
    </ProtectedRoute>
  )
}
