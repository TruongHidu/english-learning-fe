import { fireEvent, renderHook } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { useWindowFocusRefresh } from './useWindowFocusRefresh'

it('refetches on window focus and stops after leaving the path page', () => {
  const refresh = vi.fn(async () => {})
  const hook = renderHook(() => useWindowFocusRefresh(refresh))
  expect(refresh).not.toHaveBeenCalled()
  fireEvent.focus(window)
  expect(refresh).toHaveBeenCalledOnce()
  hook.unmount()
  fireEvent.focus(window)
  expect(refresh).toHaveBeenCalledOnce()
})
