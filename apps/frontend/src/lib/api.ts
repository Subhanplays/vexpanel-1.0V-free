export type UserRole = 'USER' | 'SUPPORT' | 'NODE_MANAGER' | 'ADMIN' | 'SUPER_ADMIN'

export type SessionUser = {
  id: string
  email: string
  username: string
  role: UserRole
  plan?: { name: string } | null
  createdAt?: string
  lastLoginAt?: string | null
}

export type BootstrapState = { needsBootstrap: boolean }

export function readCookie(name: string) {
  if (typeof document === 'undefined') return ''
  const found = document.cookie.split('; ').find(part => part.startsWith(`${name}=`))
  return found ? decodeURIComponent(found.slice(name.length + 1)) : ''
}

export function isPrivileged(role?: UserRole | null) {
  return role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'SUPPORT' || role === 'NODE_MANAGER'
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase()
  const headers = new Headers(init.headers ?? {})

  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    const csrf = readCookie('csrf')
    if (csrf) headers.set('x-csrf-token', csrf)
  }

  if (init.body && !(init.body instanceof FormData) && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: 'include',
  })

  const contentType = response.headers.get('content-type') ?? ''
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '')

  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload
      ? String((payload as { error?: string }).error ?? 'Request failed')
      : typeof payload === 'string' && payload.trim()
        ? payload
        : `Request failed (${response.status})`
    throw new Error(message)
  }

  return payload as T
}

export const apiGet = <T,>(path: string) => apiFetch<T>(path)

export const apiJson = <T,>(path: string, body?: unknown, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST') =>
  apiFetch<T>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

export const getAreaFromPath = (pathname: string) => (pathname.startsWith('/admin') ? 'admin' : 'user')

export const withArea = (pathname: string, pagePath: string) => {
  const areaPrefix = pathname.startsWith('/admin') ? '/admin' : ''
  const normalized = pagePath === '/' ? '/' : `/${pagePath.replace(/^\/+/, '')}`
  if (normalized === '/') return areaPrefix ? '/admin/' : '/'
  return `${areaPrefix}${normalized}`.replace(/\/{2,}/g, '/')
}

export const stripAreaPrefix = (pathname: string) =>
  pathname.startsWith('/admin') ? pathname.slice('/admin'.length) || '/' : pathname || '/'

export const isDashboardPath = (pathname: string) => {
  const clean = stripAreaPrefix(pathname).replace(/\/+$/, '') || '/'
  return clean === '/' || clean === '/dashboard'
}

