import { z } from 'zod'

export const sectionFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tên phần học là bắt buộc.')
    .max(100, 'Tên phần học không được vượt quá 100 ký tự.'),
  description: z
    .string()
    .trim()
    .max(1000, 'Mô tả phần học không được vượt quá 1000 ký tự.')
    .optional(),
  orderIndex: z
    .number({ error: 'Thứ tự sắp xếp là bắt buộc.' })
    .int('Thứ tự sắp xếp phải là số nguyên.')
    .min(0, 'Thứ tự sắp xếp phải lớn hơn hoặc bằng 0.'),
})

export type SectionFormValues = z.infer<typeof sectionFormSchema>
