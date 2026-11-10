interface BrandLogoProps {
  className?: string
  /** Hide the word mark (icon only). */
  compact?: boolean
}

export default function BrandLogo({ className = '', compact = false }: BrandLogoProps) {
  return (
    <span className={`brand-logo ${className}`} aria-label="LingoFox">
      <svg className="brand-logo__icon" viewBox="0 0 48 48" aria-hidden="true">
        <path
          className="brand-logo__body"
          d="M8 17 3 10l10 1C15.6 7.8 19.5 6 24 6s8.4 1.8 11 5l10-1-5 8v9c0 9-7.2 15-16 15S8 36 8 27V17Z"
        />
        <circle cx="17" cy="23" r="4" className="brand-logo__eye" />
        <circle cx="31" cy="23" r="4" className="brand-logo__eye" />
        <circle cx="18" cy="22" r="1.4" className="brand-logo__pupil" />
        <circle cx="32" cy="22" r="1.4" className="brand-logo__pupil" />
        <path d="m20 30 4 5 4-5Z" className="brand-logo__beak" />
      </svg>
      {compact ? null : <span className="brand-logo__word">lingofox</span>}
    </span>
  )
}
