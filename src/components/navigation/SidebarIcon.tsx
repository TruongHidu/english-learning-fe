export type SidebarIconName =
  | 'learn'
  | 'pronunciation'
  | 'leaderboard'
  | 'quests'
  | 'shop'
  | 'profile'
  | 'admin'
  | 'more'

interface SidebarIconProps {
  name: SidebarIconName
}

export default function SidebarIcon({ name }: SidebarIconProps) {
  if (name === 'learn') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path className="icon-accent" d="m3 14 13-10 13 10-3 4-10-8-10 8-3-4Z" />
        <path className="icon-main" d="M7 15.5 16 9l9 6.5V28H7V15.5Z" />
        <rect className="icon-detail" x="13" y="19" width="6" height="9" rx="2" />
      </svg>
    )
  }

  if (name === 'pronunciation') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path className="icon-main" d="M5 13c2-6 7-8 11-6 4-2 9 0 11 6v7c-2 6-7 8-11 6-4 2-9 0-11-6v-7Z" />
        <path className="icon-detail" d="M9 15c3 2 11 2 14 0-1 6-4 8-7 8s-6-2-7-8Z" />
        <path className="icon-accent" d="M10 12c4-2 8-2 12 0" />
      </svg>
    )
  }

  if (name === 'leaderboard') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path className="icon-main" d="M6 5h20v12c0 7-5 11-10 12-5-1-10-5-10-12V5Z" />
        <path className="icon-detail" d="M16 5h10v12c0 7-5 11-10 12V5Z" />
      </svg>
    )
  }

  if (name === 'quests') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path className="icon-main" d="M4 9h24v18H4V9Z" />
        <path className="icon-accent" d="M12 9V5h8v4M4 17h24" />
        <rect className="icon-detail" x="13" y="14" width="6" height="7" rx="2" />
      </svg>
    )
  }

  if (name === 'shop') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path className="icon-accent" d="M4 7h24l-2 8H6L4 7Z" />
        <path className="icon-main" d="M7 15h18v13H7V15Z" />
        <path className="icon-detail" d="M13 19h6v9h-6z" />
      </svg>
    )
  }

  if (name === 'profile') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <circle className="icon-outline" cx="16" cy="16" r="12" />
        <circle className="icon-main" cx="16" cy="12" r="4" />
        <path className="icon-main" d="M9 25c1-5 4-7 7-7s6 2 7 7" />
        <circle className="icon-accent" cx="25" cy="7" r="4" />
      </svg>
    )
  }

  if (name === 'admin') {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path
          className="icon-main"
          d="M16 4a3 3 0 0 0-3 3v1a9 9 0 0 0-2 .8l-.7-.7a3 3 0 0 0-4.2 4.2l.7.7A9 9 0 0 0 6 15H5a3 3 0 0 0 0 6h1a9 9 0 0 0 .8 2l-.7.7a3 3 0 0 0 4.2 4.2l.7-.7a9 9 0 0 0 2 .8v1a3 3 0 0 0 6 0v-1a9 9 0 0 0 2-.8l.7.7a3 3 0 0 0 4.2-4.2l-.7-.7a9 9 0 0 0 .8-2h1a3 3 0 0 0 0-6h-1a9 9 0 0 0-.8-2l.7-.7a3 3 0 0 0-4.2-4.2l-.7.7A9 9 0 0 0 19 8V7a3 3 0 0 0-3-3Z"
        />
        <circle className="icon-detail" cx="16" cy="18" r="4" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <circle className="icon-main" cx="16" cy="16" r="13" />
      <circle className="icon-detail" cx="10" cy="16" r="2" />
      <circle className="icon-detail" cx="16" cy="16" r="2" />
      <circle className="icon-detail" cx="22" cy="16" r="2" />
    </svg>
  )
}
