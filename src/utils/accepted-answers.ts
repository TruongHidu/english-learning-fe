export function acceptedAnswersError(answers: string[]): string | null {
  if (answers.length > 20) return 'Chỉ được nhập tối đa 20 đáp án dịch.'
  if (answers.some((answer) => answer.trim().length > 2000)) return 'Mỗi đáp án dịch không được vượt quá 2000 ký tự.'
  return null
}

export function cleanAcceptedAnswers(answers: string[]): string[] {
  const seen = new Set<string>()
  return answers.map((answer) => answer.trim()).filter((answer) => {
    const key = answer.toLowerCase().replace(/\s+/g, ' ')
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}
