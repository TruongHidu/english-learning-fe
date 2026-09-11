import { useEffect } from 'react'

/** Only mount on curriculum pages; quiz session state remains untouched. */
export function useWindowFocusRefresh(refresh: () => Promise<void>) {
  useEffect(() => {
    const onFocus = () => { void refresh() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])
}
