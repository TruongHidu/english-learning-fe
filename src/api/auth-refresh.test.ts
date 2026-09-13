import { beforeEach, afterEach, expect, test, vi } from 'vitest'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import api from './axios'
import { authApi, refreshAccessToken } from './refresh'
import { authStorage, AUTH_INVALIDATED_EVENT } from '../utils/auth-storage'
import { authService } from '../services/auth.service'

const originalAdapter = api.defaults.adapter
const originalAuthAdapter = authApi.defaults.adapter
function failure(config: InternalAxiosRequestConfig, status = 401) {
  return Promise.reject(new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined,
    { status, statusText: 'Unauthorized', data: { code: 'INVALID_TOKEN' }, headers: {}, config }))
}
beforeEach(() => { authStorage.clear() })
afterEach(() => {
  api.defaults.adapter = originalAdapter
  authApi.defaults.adapter = originalAuthAdapter
  vi.restoreAllMocks()
})

test('parallel 401 requests share one refresh and retry with the new token', async () => {
  authStorage.setAccessToken('old')
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  const refresh = vi.fn(async (config: InternalAxiosRequestConfig) => {
    await gate
    return { data: { data: { accessToken: 'new' } }, status: 200, statusText: 'OK', headers: {}, config }
  })
  authApi.defaults.adapter = refresh
  const calls: string[] = []
  api.defaults.adapter = async config => {
    calls.push(String(config.headers.get('Authorization')))
    if (config.headers.get('Authorization') === 'Bearer old') return failure(config)
    return { data: 'ok', status: 200, statusText: 'OK', headers: {}, config }
  }
  const requests = Promise.all([api.get('/users/me'), api.get('/courses')])
  await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1))
  release()
  await requests
  expect(refresh).toHaveBeenCalledTimes(1)
  expect(calls.filter(token => token === 'Bearer new')).toHaveLength(2)
  expect(authStorage.getAccessToken()).toBe('new')
  expect(localStorage.getItem('lingofox.auth.session')).toBeNull()
})

test('retry stops after one attempt and clears auth if the retried request is unauthorized', async () => {
  authStorage.setAccessToken('old')
  const refresh = vi.fn(async (config: InternalAxiosRequestConfig) =>
    ({ data: { data: { accessToken: 'new' } }, status: 200, statusText: 'OK', headers: {}, config }))
  authApi.defaults.adapter = refresh
  const requests = vi.fn(failure)
  api.defaults.adapter = config => requests(config)
  await expect(api.get('/users/me')).rejects.toBeDefined()
  expect(requests).toHaveBeenCalledTimes(2)
  expect(refresh).toHaveBeenCalledTimes(1)
  expect(authStorage.getAccessToken()).toBeNull()
})

test('refresh failure invalidates auth without retrying protected API', async () => {
  authStorage.setAccessToken('old')
  const invalidated = vi.fn()
  window.addEventListener(AUTH_INVALIDATED_EVENT, invalidated)
  authApi.defaults.adapter = config => failure(config)
  const requests = vi.fn(failure)
  api.defaults.adapter = config => requests(config)
  await expect(api.get('/courses')).rejects.toBeDefined()
  expect(requests).toHaveBeenCalledTimes(1)
  expect(invalidated).toHaveBeenCalledTimes(1)
  expect(authStorage.getAccessToken()).toBeNull()
  window.removeEventListener(AUTH_INVALIDATED_EVENT, invalidated)
})

test('auth endpoints and 403 never trigger refresh', async () => {
  const refresh = vi.fn()
  authApi.defaults.adapter = refresh
  api.defaults.adapter = config => failure(config, config.url === '/admin' ? 403 : 401)
  for (const url of ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout', '/admin']) {
    await expect(api.post(url)).rejects.toBeDefined()
  }
  expect(refresh).not.toHaveBeenCalled()
})

test('logout during an in-flight refresh prevents resurrection of the session', async () => {
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  authApi.defaults.adapter = async config => {
    await gate
    return { data: { data: { accessToken: 'late' } }, status: 200, statusText: 'OK', headers: {}, config }
  }
  const pending = refreshAccessToken()
  authStorage.clear()
  release()
  await expect(pending).rejects.toThrow('Session changed')
  expect(authStorage.getAccessToken()).toBeNull()
})

test('logout waits for the rotated cookie before revoking the server session', async () => {
  let release!: () => void
  const gate = new Promise<void>(resolve => { release = resolve })
  const calls: string[] = []
  authApi.defaults.adapter = async config => {
    calls.push(config.url!)
    if (config.url === '/auth/refresh') await gate
    return { data: { data: { accessToken: 'late' } }, status: 200, statusText: 'OK', headers: {}, config }
  }
  const refreshed = refreshAccessToken().catch(() => undefined)
  const logout = authService.logout()
  expect(authStorage.getAccessToken()).toBeNull()
  expect(calls).not.toContain('/auth/logout')
  release()
  await Promise.all([refreshed, logout])
  expect(calls).toEqual(['/auth/refresh', '/auth/logout'])
  expect(authStorage.getAccessToken()).toBeNull()
})
