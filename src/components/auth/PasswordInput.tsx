import { useState } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

interface PasswordInputProps {
  id: string
  label: string
  autoComplete: 'current-password' | 'new-password'
  error?: string
  registration: UseFormRegisterReturn
}

export default function PasswordInput({
  id,
  label,
  autoComplete,
  error,
  registration,
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false)
  const errorId = `${id}-error`

  return (
    <div className="form-control">
      <label htmlFor={id}>{label}</label>
      <div className="password-input-wrap">
        <input
          {...registration}
          id={id}
          type={isVisible ? 'text' : 'password'}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
        />
        <button
          className="password-toggle"
          type="button"
          aria-label={isVisible ? `Ẩn ${label.toLowerCase()}` : `Hiện ${label.toLowerCase()}`}
          aria-pressed={isVisible}
          onClick={() => setIsVisible((current) => !current)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
            <circle cx="12" cy="12" r="2.8" />
            {!isVisible && <path d="m4 4 16 16" />}
          </svg>
        </button>
      </div>
      {error && <p id={errorId} className="field-error">{error}</p>}
    </div>
  )
}
