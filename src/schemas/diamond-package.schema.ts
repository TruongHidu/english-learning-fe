import { z } from 'zod'

export const diamondPackageFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tên gói kim cương không được để trống.')
    .max(100, 'Tên gói không được vượt quá 100 ký tự.'),
  diamondAmount: z
    .number({ error: 'Số kim cương là bắt buộc.' })
    .int('Số kim cương phải là số nguyên.')
    .positive('Số kim cương phải lớn hơn 0.'),
  bonusDiamond: z
    .number()
    .int('Kim cương thưởng phải là số nguyên.')
    .min(0, 'Kim cương thưởng không được âm.'),
  price: z
    .number({ error: 'Giá gói là bắt buộc.' })
    .int('Giá gói phải là số nguyên.')
    .positive('Giá gói phải lớn hơn 0.'),
  description: z
    .string()
    .trim()
    .max(500, 'Mô tả không được vượt quá 500 ký tự.')
    .optional()
    .or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  orderIndex: z
    .number({ error: 'Thứ tự hiển thị là bắt buộc.' })
    .int('Thứ tự hiển thị phải là số nguyên.')
    .min(0, 'Thứ tự hiển thị không được âm.'),
})

export type DiamondPackageFormValues = z.infer<typeof diamondPackageFormSchema>
