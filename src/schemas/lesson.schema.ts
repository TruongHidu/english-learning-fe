import { z } from 'zod'

export const lessonFormSchema = z.object({
  name: z.string().trim().min(2, 'Tên màn học phải có ít nhất 2 ký tự.').max(100, 'Tên màn học không được vượt quá 100 ký tự.'),
  description: z.string().trim().max(1000, 'Mô tả không được vượt quá 1000 ký tự.').optional(),
  requiredScore: z.number({ error: 'Điểm yêu cầu là bắt buộc.' }).int('Điểm yêu cầu phải là số nguyên.').min(0, 'Điểm yêu cầu không được âm.').max(100, 'Điểm yêu cầu tối đa là 100.'),
  questionCount: z.number({ error: 'Số câu hỏi là bắt buộc.' }).int('Số câu hỏi phải là số nguyên.').min(0, 'Số câu hỏi không được âm.').max(100, 'Tối đa 100 câu hỏi.'),
  xpReward: z.number({ error: 'XP thưởng là bắt buộc.' }).int('XP thưởng phải là số nguyên.').min(0, 'XP thưởng không được âm.'),
  diamondReward: z.number({ error: 'Kim cương thưởng là bắt buộc.' }).int('Kim cương thưởng phải là số nguyên.').min(0, 'Kim cương thưởng không được âm.'),
  orderIndex: z.number({ error: 'Thứ tự là bắt buộc.' }).int('Thứ tự phải là số nguyên.').min(0, 'Thứ tự không được âm.'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'INACTIVE']),
})

export type LessonFormValues = z.infer<typeof lessonFormSchema>
