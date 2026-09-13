import { acceptedAnswersError } from '../../utils/accepted-answers'

interface Props {
  value: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
  error?: string | null
}

export default function AcceptedAnswersField({ value, onChange, disabled, error }: Props) {
  const message = acceptedAnswersError(value) ?? error
  return (
    <label className="block space-y-2 text-xs font-bold">
      <span>Các đáp án dịch được chấp nhận</span>
      <textarea className="admin-field w-full" rows={3} value={value.join('\n')}
        disabled={disabled} aria-invalid={Boolean(message)}
        onChange={(event) => onChange(event.target.value.split('\n'))}
        placeholder="Mỗi dòng một bản dịch thay thế (không bắt buộc)" />
      <span className="block font-normal">Thêm hoặc xóa dòng để chỉnh đáp án. Tối đa 20 bản dịch do quản trị viên duyệt.</span>
      {message && <span role="alert" className="block text-rose-700">{message}</span>}
    </label>
  )
}
