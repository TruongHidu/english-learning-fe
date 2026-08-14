import { z } from 'zod'

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Vui lòng nhập email.')
  .email('Email không đúng định dạng.')
  .transform((value) => value.toLowerCase())

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
})

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, 'Vui lòng nhập tên hiển thị.')
      .min(2, 'Tên hiển thị phải có ít nhất 2 ký tự.')
      .max(50, 'Tên hiển thị không được vượt quá 50 ký tự.'),
    email: emailSchema,
    password: z
      .string()
      .min(1, 'Vui lòng nhập mật khẩu.')
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự.')
      .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa.')
      .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường.')
      .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 chữ số.'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp.',
    path: ['confirmPassword'],
  })

export type LoginFormValues = z.infer<typeof loginSchema>
export type RegisterFormValues = z.infer<typeof registerSchema>
