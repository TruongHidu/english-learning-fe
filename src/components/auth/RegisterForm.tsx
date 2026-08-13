import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { normalizeApiError } from '../../api/api-error'
import { registerSchema } from '../../schemas/auth.schema'
import type { RegisterFormValues } from '../../schemas/auth.schema'
import { authService } from '../../services/auth.service'
import { getRegisterErrorMessage } from '../../utils/auth-errors'
import PasswordInput from './PasswordInput'

type RegisterField = keyof RegisterFormValues

function isRegisterField(field: string): field is RegisterField {
  return (
    field === 'displayName' ||
    field === 'email' ||
    field === 'password' ||
    field === 'confirmPassword'
  )
}

export default function RegisterForm({ returnTo }: { returnTo?: string }) {
  const navigate = useNavigate()
  const [formError, setFormError] = useState('')
  const {
    clearErrors,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onTouched',
  })

  function clearServerFeedback(field: RegisterField) {
    if (errors[field]?.type === 'server') clearErrors(field)
    setFormError('')
  }

  async function onSubmit(values: RegisterFormValues) {
    setFormError('')

    try {
      const response = await authService.register({
        displayName: values.displayName,
        email: values.email,
        password: values.password,
      })

      navigate('/login', {
        replace: true,
        state: {
          registeredEmail: values.email,
          flashMessage: response.message || 'Đăng ký tài khoản thành công.',
          from: returnTo,
        },
      })
    } catch (error) {
      const apiError = normalizeApiError(error)

      if (apiError.code === 'EMAIL_ALREADY_EXISTS') {
        setError('email', {
          type: 'server',
          message: 'Email này đã được sử dụng.',
        })
        return
      }

      if (apiError.code === 'VALIDATION_ERROR') {
        let hasMappedFieldError = false
        for (const fieldError of apiError.fieldErrors) {
          if (isRegisterField(fieldError.field)) {
            setError(fieldError.field, { type: 'server', message: fieldError.message })
            hasMappedFieldError = true
          }
        }
        if (hasMappedFieldError) return
      }

      setFormError(getRegisterErrorMessage(apiError))
    }
  }

  const displayNameRegistration = register('displayName', {
    onChange: () => clearServerFeedback('displayName'),
  })
  const emailRegistration = register('email', {
    onChange: () => clearServerFeedback('email'),
  })
  const passwordRegistration = register('password', {
    onChange: () => clearServerFeedback('password'),
  })
  const confirmPasswordRegistration = register('confirmPassword', {
    onChange: () => clearServerFeedback('confirmPassword'),
  })

  return (
    <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="form-control">
        <label htmlFor="register-name">Tên hiển thị</label>
        <input
          {...displayNameRegistration}
          id="register-name"
          type="text"
          autoComplete="name"
          aria-invalid={Boolean(errors.displayName)}
          aria-describedby={errors.displayName ? 'register-name-error' : undefined}
        />
        {errors.displayName?.message && (
          <p id="register-name-error" className="field-error">{errors.displayName.message}</p>
        )}
      </div>

      <div className="form-control">
        <label htmlFor="register-email">Email</label>
        <input
          {...emailRegistration}
          id="register-email"
          type="email"
          autoComplete="email"
          inputMode="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'register-email-error' : undefined}
        />
        {errors.email?.message && (
          <p id="register-email-error" className="field-error">{errors.email.message}</p>
        )}
      </div>

      <PasswordInput
        id="register-password"
        label="Mật khẩu"
        autoComplete="new-password"
        error={errors.password?.message}
        registration={passwordRegistration}
      />

      <PasswordInput
        id="register-confirm-password"
        label="Xác nhận mật khẩu"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        registration={confirmPasswordRegistration}
      />

      {formError && <div className="form-alert form-alert--error" role="alert">{formError}</div>}

      <button className="auth-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting && <span className="button-spinner" aria-hidden="true" />}
        {isSubmitting ? 'ĐANG ĐĂNG KÝ...' : 'ĐĂNG KÝ'}
      </button>
    </form>
  )
}
