export function moveItemById<T extends { id: string }>(items: T[], sourceId: string, targetId: string): T[] {
  const sourceIndex = items.findIndex((item) => item.id === sourceId)
  const targetIndex = items.findIndex((item) => item.id === targetId)
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return items
  const next = [...items]
  const [moved] = next.splice(sourceIndex, 1)
  next.splice(targetIndex, 0, moved)
  return next
}

export function moveItemByOffset<T extends { id: string }>(items: T[], itemId: string, offset: -1 | 1): T[] {
  const currentIndex = items.findIndex((item) => item.id === itemId)
  const targetIndex = currentIndex + offset
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= items.length) return items
  return moveItemById(items, itemId, items[targetIndex].id)
}

export function assignOrderIndexes<T extends { orderIndex: number }>(items: T[]): T[] {
  return items.map((item, index) => ({ ...item, orderIndex: index }))
}
