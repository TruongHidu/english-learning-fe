import { z } from 'zod'

export const updateDisplayNameSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Tên hiển thị không được chỉ chứa khoảng trắng.')
    .min(2, 'Tên hiển thị phải có ít nhất 2 ký tự.')
    .max(50, 'Tên hiển thị không được vượt quá 50 ký tự.'),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại.'),
    newPassword: z
      .string()
      .min(1, 'Vui lòng nhập mật khẩu mới.')
      .min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự.')
      .regex(/[A-Z]/, 'Mật khẩu mới phải có ít nhất 1 chữ hoa.')
      .regex(/[a-z]/, 'Mật khẩu mới phải có ít nhất 1 chữ thường.')
      .regex(/[0-9]/, 'Mật khẩu mới phải có ít nhất 1 chữ số.'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới.'),
  })
  .superRefine((data, context) => {
    if (data.confirmPassword.length > 0 && data.newPassword !== data.confirmPassword) {
      context.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Mật khẩu xác nhận không khớp.',
      })
    }
  })

export type UpdateDisplayNameFormValues = z.infer<typeof updateDisplayNameSchema>
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>
