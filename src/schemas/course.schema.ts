import { z } from 'zod'

const urlSchema = z
  .string()
  .trim()
  .url('Đường dẫn ảnh đại diện không đúng định dạng.')
  .or(z.literal(''))
  .nullable()
  .optional()

export const courseFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tên khóa học là bắt buộc.')
    .max(100, 'Tên khóa học không được vượt quá 100 ký tự.'),
  description: z
    .string()
    .trim()
    .max(1000, 'Mô tả khóa học không được vượt quá 1000 ký tự.')
    .optional(),
  level: z
    .string()
    .trim()
    .min(1, 'Trình độ là bắt buộc.')
    .max(20, 'Trình độ không được vượt quá 20 ký tự.'),
  thumbnailUrl: urlSchema,
  orderIndex: z
    .number({ error: 'Thứ tự sắp xếp là bắt buộc.' })
    .int('Thứ tự sắp xếp phải là số nguyên.')
    .min(0, 'Thứ tự sắp xếp phải lớn hơn hoặc bằng 0.'),
})

export type CourseFormValues = z.infer<typeof courseFormSchema>
