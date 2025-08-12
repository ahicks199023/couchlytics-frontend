// src/lib/http.ts
import axios from 'axios'

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.couchlytics.com'

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // critical for cookies
  headers: { 'Content-Type': 'application/json' },
})


