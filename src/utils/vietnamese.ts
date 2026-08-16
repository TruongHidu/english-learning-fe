export function removeVietnameseAccents(str: string): string {
  if (!str) return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

export function vietnameseIncludes(haystack: string, needle: string): boolean {
  if (!needle) return true
  const normHaystack = removeVietnameseAccents(haystack)
  const normNeedle = removeVietnameseAccents(needle)
  return normHaystack.includes(normNeedle)
}
