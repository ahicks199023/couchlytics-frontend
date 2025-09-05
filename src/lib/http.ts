// src/lib/http.ts
import axios from 'axios'

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.couchlytics.com'

export const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // critical for cookies
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, // 30 second timeout for better error handling
})

// Add request interceptor for debugging
http.interceptors.request.use(
  (config) => {
    console.log(`🌐 HTTP Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('❌ HTTP Request Error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor for debugging
http.interceptors.response.use(
  (response) => {
    console.log(`✅ HTTP Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('❌ HTTP Response Error:', error)
    return Promise.reject(error)
  }
)


