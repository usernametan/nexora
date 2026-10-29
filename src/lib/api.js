const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/$/, '')

let authToken = null

export function setApiToken(token) {
  authToken = token || null
}

export function getApiBase() {
  return API_BASE
}

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.payload = payload
  }
}

async function parseResponse(response) {
  if (response.status === 204) return null
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {})
  if (!options.form && options.body !== undefined) headers.set('Content-Type', 'application/json')
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`)

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.form
        ? options.body
        : options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
      keepalive: Boolean(options.keepalive),
      signal: options.signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ApiError('The server is unreachable. Your changes stay saved on this device.', 0, null)
  }

  const payload = await parseResponse(response)
  if (!response.ok) {
    const message = payload?.message || payload?.error || `Request failed with status ${response.status}.`
    throw new ApiError(message, response.status, payload)
  }
  return payload
}

export async function apiDownload(path) {
  const headers = new Headers()
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`)

  let response
  try {
    response = await fetch(`${API_BASE}${path}`, { headers })
  } catch {
    throw new ApiError('The server is unreachable. Your changes stay saved on this device.', 0, null)
  }
  if (!response.ok) {
    const payload = await parseResponse(response)
    const message = payload?.message || payload?.error || `Download failed with status ${response.status}.`
    throw new ApiError(message, response.status, payload)
  }
  return response.blob()
}

export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, body, options) => apiRequest(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => apiRequest(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => apiRequest(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => apiRequest(path, { ...options, method: 'DELETE' }),
  download: apiDownload,
  upload: (path, formData, options) => apiRequest(path, {
    ...options,
    method: 'POST',
    body: formData,
    form: true,
  }),
}
