// src/features/auth/api.ts
import { http } from '@/lib/http'

export type RegisterPayload = {
  firstName: string
  lastName: string
  email: string
  password: string
  league?: { name?: string; seasonYear?: number }
  team?: { name?: string }
}

export async function login(email: string, password: string, remember = false) {
  const res = await http.post('/auth/login', { email, password, remember })
  return res.data
}

export async function getAuthStatus() {
  const res = await http.get('/auth/status')
  return res.data as { authenticated: boolean; user?: unknown }
}

export async function logout() {
  await http.post('/auth/logout')
}

export async function registerUser(payload: RegisterPayload) {
  const res = await http.post('/auth/register', payload, { validateStatus: () => true })
  if (res.status === 201) return res.data
  if (res.status === 409) throw new Error('An account with this email already exists.')
  throw new Error((res.data as any)?.error ?? 'Registration failed.')
}


