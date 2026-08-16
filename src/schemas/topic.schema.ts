import { z } from 'zod'

export const topicFormSchema = z.object({
  name: z.string().trim().min(2, 'Tên chủ đề phải có ít nhất 2 ký tự.').max(100, 'Tên chủ đề không được vượt quá 100 ký tự.'),
  description: z.string().trim().max(1000, 'Mô tả không được vượt quá 1000 ký tự.').optional(),
  orderIndex: z.number({ error: 'Thứ tự là bắt buộc.' }).int('Thứ tự phải là số nguyên.').min(0, 'Thứ tự không được âm.'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'INACTIVE']),
})

export type TopicFormValues = z.infer<typeof topicFormSchema>
