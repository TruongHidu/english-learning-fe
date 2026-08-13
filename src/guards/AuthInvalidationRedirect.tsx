import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AUTH_INVALIDATED_EVENT } from '../utils/auth-storage'

export default function AuthInvalidationRedirect() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    function handleInvalidatedAuth() {
      if (location.pathname === '/login' || location.pathname === '/register') return

      const from = `${location.pathname}${location.search}${location.hash}`
      navigate('/login', {
        replace: true,
        state: {
          from,
          flashMessage: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        },
      })
    }

    window.addEventListener(AUTH_INVALIDATED_EVENT, handleInvalidatedAuth)
    return () => window.removeEventListener(AUTH_INVALIDATED_EVENT, handleInvalidatedAuth)
  }, [location.hash, location.pathname, location.search, navigate])

  return null
}
