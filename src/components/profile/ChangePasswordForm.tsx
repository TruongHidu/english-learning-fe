import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { normalizeApiError } from '../../api/api-error'
import PasswordInput from '../auth/PasswordInput'
import { changePasswordSchema } from '../../schemas/user.schema'
import type { ChangePasswordFormValues } from '../../schemas/user.schema'
import { userService } from '../../services/user.service'
import { getChangePasswordErrorMessage } from '../../utils/user-errors'

type PasswordField = keyof ChangePasswordFormValues

function isPasswordField(field: string): field is PasswordField {
  return (
    field === 'currentPassword' ||
    field === 'newPassword' ||
    field === 'confirmPassword'
  )
}

export default function ChangePasswordForm() {
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isUnavailable, setIsUnavailable] = useState(false)
  const {
    clearErrors,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
    setFocus,
    watch,
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    mode: 'onTouched',
  })

  const newPassword = watch('newPassword')
  const passwordRequirements = [
    { label: 'Ít nhất 8 ký tự', met: newPassword.length >= 8 },
    { label: 'Có ít nhất 1 chữ hoa', met: /[A-Z]/.test(newPassword) },
    { label: 'Có ít nhất 1 chữ thường', met: /[a-z]/.test(newPassword) },
    { label: 'Có ít nhất 1 chữ số', met: /[0-9]/.test(newPassword) },
  ]

  function clearServerFeedback(field: PasswordField) {
    if (errors[field]?.type === 'server') clearErrors(field)
    setFormError('')
    setSuccessMessage('')
  }

  async function onSubmit(values: ChangePasswordFormValues) {
    setFormError('')
    setSuccessMessage('')

    try {
      await userService.changePassword(values)
      reset()
      setSuccessMessage('Đổi mật khẩu thành công.')
    } catch (error) {
      const apiError = normalizeApiError(error)

      if (apiError.code === 'CURRENT_PASSWORD_INCORRECT') {
        setError('currentPassword', {
          type: 'server',
          message: 'Mật khẩu hiện tại không chính xác.',
        })
        setFocus('currentPassword')
        return
      }

      if (apiError.code === 'NEW_PASSWORD_SAME_AS_CURRENT') {
        setError('newPassword', {
          type: 'server',
          message: 'Mật khẩu mới không được giống mật khẩu hiện tại.',
        })
        setFocus('newPassword')
        return
      }

      if (apiError.code === 'PASSWORD_CHANGE_NOT_AVAILABLE') {
        setIsUnavailable(true)
        setFormError('Tài khoản này không hỗ trợ đổi mật khẩu tại đây.')
        return
      }

      if (apiError.code === 'VALIDATION_ERROR') {
        let firstMappedField: PasswordField | null = null
        for (const fieldError of apiError.fieldErrors) {
          if (!isPasswordField(fieldError.field)) continue
          firstMappedField ??= fieldError.field
          setError(fieldError.field, { type: 'server', message: fieldError.message })
        }
        if (firstMappedField) {
          setFocus(firstMappedField)
          return
        }
      }

      setFormError(getChangePasswordErrorMessage(apiError))
    }
  }

  if (isUnavailable) {
    return (
      <section className="profile-section" aria-labelledby="change-password-title">
        <div className="profile-section__heading">
          <div>
            <span>BẢO MẬT</span>
            <h2 id="change-password-title">Đổi mật khẩu</h2>
          </div>
        </div>
        <div className="profile-provider-notice" role="status">
          <span aria-hidden="true">i</span>
          <p>Tài khoản này không hỗ trợ đổi mật khẩu tại đây.</p>
        </div>
      </section>
    )
  }

  const currentPasswordRegistration = register('currentPassword', {
    onChange: () => clearServerFeedback('currentPassword'),
  })
  const newPasswordRegistration = register('newPassword', {
    onChange: () => clearServerFeedback('newPassword'),
  })
  const confirmPasswordRegistration = register('confirmPassword', {
    onChange: () => clearServerFeedback('confirmPassword'),
  })

  return (
    <section className="profile-section" aria-labelledby="change-password-title">
      <div className="profile-section__heading">
        <div>
          <span>BẢO MẬT</span>
          <h2 id="change-password-title">Đổi mật khẩu</h2>
        </div>
      </div>

      <form className="profile-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <PasswordInput
          id="profile-current-password"
          label="Mật khẩu hiện tại"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          registration={currentPasswordRegistration}
        />

        <PasswordInput
          id="profile-new-password"
          label="Mật khẩu mới"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          registration={newPasswordRegistration}
        />

        <ul className="password-requirements" aria-label="Yêu cầu mật khẩu mới">
          {passwordRequirements.map((requirement) => (
            <li className={requirement.met ? 'password-requirement--met' : ''} key={requirement.label}>
              <span aria-hidden="true">{requirement.met ? '✓' : '○'}</span>
              {requirement.label}
            </li>
          ))}
        </ul>

        <PasswordInput
          id="profile-confirm-password"
          label="Xác nhận mật khẩu mới"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          registration={confirmPasswordRegistration}
        />

        {formError && <div className="profile-alert profile-alert--error" role="alert">{formError}</div>}
        {successMessage && (
          <div className="profile-alert profile-alert--success" role="status">
            {successMessage}
          </div>
        )}

        <button className="profile-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting && <span className="button-spinner" aria-hidden="true" />}
          {isSubmitting ? 'ĐANG ĐỔI MẬT KHẨU...' : 'ĐỔI MẬT KHẨU'}
        </button>
      </form>
    </section>
  )
}
