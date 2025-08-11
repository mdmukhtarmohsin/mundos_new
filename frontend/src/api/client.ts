import axios from 'axios'

export const api = axios.create({
  baseURL: '/api/v1'
})

export function setAgentApiKeyHeader(key: string | null) {
  if (key) {
    api.defaults.headers.common['X-API-Key'] = key
    localStorage.setItem('X_API_KEY', key)
  } else {
    delete api.defaults.headers.common['X-API-Key']
    localStorage.removeItem('X_API_KEY')
  }
}

// Initialize from storage if present
const stored = localStorage.getItem('X_API_KEY')
if (stored) {
  setAgentApiKeyHeader(stored)
}

