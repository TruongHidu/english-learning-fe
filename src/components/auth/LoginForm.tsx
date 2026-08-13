import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { normalizeApiError } from '../../api/api-error'
import { useAuth } from '../../hooks/useAuth'
import { loginSchema } from '../../schemas/auth.schema'
import type { LoginFormValues } from '../../schemas/auth.schema'
import { getLoginErrorMessage } from '../../utils/auth-errors'
import PasswordInput from './PasswordInput'

interface LoginFormProps {
  initialEmail?: string
  returnTo?: string
}

function getSafeReturnPath(returnTo?: string): string {
  if (!returnTo || !returnTo.startsWith('/') || returnTo.startsWith('//')) {
    return '/learn'
  }
  if (returnTo === '/login' || returnTo === '/register') return '/learn'
  return returnTo
}

export default function LoginForm({ initialEmail = '', returnTo }: LoginFormProps) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [formError, setFormError] = useState('')
  const {
    clearErrors,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: initialEmail, password: '' },
    mode: 'onTouched',
  })

  function clearServerFeedback(field: keyof LoginFormValues) {
    if (errors[field]?.type === 'server') clearErrors(field)
    setFormError('')
  }

  async function onSubmit(values: LoginFormValues) {
    setFormError('')

    try {
      await login(values)
      navigate(getSafeReturnPath(returnTo), {
        replace: true,
        state: { flashMessage: 'Đăng nhập thành công.' },
      })
    } catch (error) {
      const apiError = normalizeApiError(error)

      if (apiError.code === 'VALIDATION_ERROR') {
        let hasMappedFieldError = false
        for (const fieldError of apiError.fieldErrors) {
          if (fieldError.field === 'email' || fieldError.field === 'password') {
            setError(fieldError.field, { type: 'server', message: fieldError.message })
            hasMappedFieldError = true
          }
        }
        if (hasMappedFieldError) return
      }

      setFormError(getLoginErrorMessage(apiError))
    }
  }

  const emailRegistration = register('email', {
    onChange: () => clearServerFeedback('email'),
  })
  const passwordRegistration = register('password', {
    onChange: () => clearServerFeedback('password'),
  })

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="form-control">
        <label htmlFor="login-email">Email</label>
        <input
          {...emailRegistration}
          id="login-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'login-email-error' : undefined}
        />
        {errors.email?.message && (
          <p id="login-email-error" className="field-error">{errors.email.message}</p>
        )}
      </div>

      <PasswordInput
        id="login-password"
        label="Mật khẩu"
        autoComplete="current-password"
        error={errors.password?.message}
        registration={passwordRegistration}
      />

      {formError && <div className="form-alert form-alert--error" role="alert">{formError}</div>}

      <button className="auth-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting && <span className="button-spinner" aria-hidden="true" />}
        {isSubmitting ? 'ĐANG ĐĂNG NHẬP...' : 'ĐĂNG NHẬP'}
      </button>
    </form>
  )
}
