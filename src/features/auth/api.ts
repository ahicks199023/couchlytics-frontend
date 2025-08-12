// src/features/auth/api.ts
import { http } from '@/lib/http'

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


