import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { useContext, StrictMode } from 'react'
import { AuthProvider } from './AuthProvider'
import { AuthContext } from './auth-context'
import { authApi } from '../api/refresh'
import api from '../api/axios'
import { authStorage } from '../utils/auth-storage'

const original = api.defaults.adapter
const originalAuth = authApi.defaults.adapter
afterEach(() => {
  cleanup()
  api.defaults.adapter = original
  authApi.defaults.adapter = originalAuth
  authStorage.clear()
  vi.unstubAllGlobals()
})
function State() {
  const auth = useContext(AuthContext)!
  return <div>{auth.isInitializing ? 'loading' : auth.user?.displayName ?? 'guest'}</div>
}
test('reload restores the cookie session in StrictMode and SSE reconnects when token changes', async () => {
  authStorage.clear()
  const streams: Array<{ url: string; close: ReturnType<typeof vi.fn> }> = []
  class Stream {
    close = vi.fn()
    url: string
    constructor(url: string) { this.url = url; streams.push(this) }
  }
  vi.stubGlobal('EventSource', Stream)
  vi.stubGlobal('BroadcastChannel', undefined)
  const refresh = vi.fn(async config => ({ data: { data: { accessToken: 'restored' } }, status: 200, statusText: 'OK', headers: {}, config }))
  authApi.defaults.adapter = refresh
  api.defaults.adapter = async config => ({ data: { data: { user: {
    id: 'u', displayName: 'Learner', email: 'u@example.com', avatarUrl: null, role: 'USER', stats: { currentHeart: 5, maxHeart: 5, diamond: 0, totalXp: 0, level: 1, currentStreak: 0 },
  } } }, status: 200, statusText: 'OK', headers: {}, config })
  render(<StrictMode><MemoryRouter><AuthProvider><State /></AuthProvider></MemoryRouter></StrictMode>)
  expect(screen.getByText('loading')).toBeTruthy()
  await screen.findByText('Learner')
  expect(refresh).toHaveBeenCalledTimes(1)
  await waitFor(() => expect(streams.some(s => s.url.includes('token=restored'))).toBe(true))
  const previous = streams.at(-1)!
  act(() => authStorage.setAccessToken('rotated'))
  await waitFor(() => expect(streams.at(-1)!.url).toContain('token=rotated'))
  expect(previous.close).toHaveBeenCalled()
  expect(localStorage.getItem('lingofox.auth.session')).toBeNull()
})
