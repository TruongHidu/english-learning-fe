import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { normalizeApiError } from '../../api/api-error'
import { updateDisplayNameSchema } from '../../schemas/user.schema'
import type { UpdateDisplayNameFormValues } from '../../schemas/user.schema'
import { userService } from '../../services/user.service'
import type { UpdatedDisplayNameUser } from '../../types/user.types'
import { getUpdateNameErrorMessage } from '../../utils/user-errors'

interface UpdateDisplayNameFormProps {
  displayName: string
  onUpdated(updatedUser: UpdatedDisplayNameUser): void
}

export default function UpdateDisplayNameForm({
  displayName,
  onUpdated,
}: UpdateDisplayNameFormProps) {
  const [formError, setFormError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const {
    clearErrors,
    formState: { errors, isDirty, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
    watch,
  } = useForm<UpdateDisplayNameFormValues>({
    resolver: zodResolver(updateDisplayNameSchema),
    defaultValues: { displayName },
    mode: 'onTouched',
  })
  const displayNameValue = watch('displayName')
  const hasMeaningfulChange = displayNameValue.trim() !== displayName.trim()

  useEffect(() => {
    reset({ displayName })
  }, [displayName, reset])

  async function onSubmit(values: UpdateDisplayNameFormValues) {
    setFormError('')
    setSuccessMessage('')

    try {
      const updatedUser = await userService.updateDisplayName({
        displayName: values.displayName,
      })
      onUpdated(updatedUser)
      reset({ displayName: updatedUser.displayName })
      setSuccessMessage('Cập nhật tên hiển thị thành công.')
    } catch (error) {
      const apiError = normalizeApiError(error)

      if (apiError.code === 'VALIDATION_ERROR') {
        const displayNameError = apiError.fieldErrors.find(
          (fieldError) => fieldError.field === 'displayName',
        )
        if (displayNameError) {
          setError('displayName', { type: 'server', message: displayNameError.message })
          return
        }
      }

      setFormError(getUpdateNameErrorMessage(apiError))
    }
  }

  const displayNameRegistration = register('displayName', {
    onChange: () => {
      if (errors.displayName?.type === 'server') clearErrors('displayName')
      setFormError('')
      setSuccessMessage('')
    },
  })

  return (
    <section className="profile-section" aria-labelledby="update-name-title">
      <div className="profile-section__heading">
        <div>
          <span>THÔNG TIN CÁ NHÂN</span>
          <h2 id="update-name-title">Tên hiển thị</h2>
        </div>
      </div>

      <form className="profile-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-control">
          <label htmlFor="profile-display-name">Tên hiển thị</label>
          <input
            {...displayNameRegistration}
            id="profile-display-name"
            type="text"
            autoComplete="name"
            maxLength={50}
            aria-invalid={Boolean(errors.displayName)}
            aria-describedby={errors.displayName ? 'profile-display-name-error' : undefined}
          />
          {errors.displayName?.message && (
            <p id="profile-display-name-error" className="field-error">
              {errors.displayName.message}
            </p>
          )}
        </div>

        {formError && <div className="profile-alert profile-alert--error" role="alert">{formError}</div>}
        {successMessage && (
          <div className="profile-alert profile-alert--success" role="status">
            {successMessage}
          </div>
        )}

        <button
          className="profile-submit"
          type="submit"
          disabled={!isDirty || !hasMeaningfulChange || isSubmitting}
        >
          {isSubmitting && <span className="button-spinner" aria-hidden="true" />}
          {isSubmitting ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
        </button>
      </form>
    </section>
  )
}
