export interface LevelInfo {
  level: number
  xpInCurrentLevel: number
  xpRequiredForLevel: number
  totalXp: number
}

/**
 * Thống kê Level theo Cấp số cộng:
 * Level 1: Cần 100 XP (0 - 100 XP)
 * Level 2: Cần 200 XP (100 - 300 XP)
 * Level 3: Cần 300 XP (300 - 600 XP)
 * Level N: Cần N * 100 XP
 */
export function getLevelInfo(totalXp: number): LevelInfo {
  if (totalXp <= 0) {
    return {
      level: 1,
      xpInCurrentLevel: 0,
      xpRequiredForLevel: 100,
      totalXp: 0,
    }
  }

  const level = Math.floor((1 + Math.sqrt(1 + 8 * (totalXp / 100))) / 2)
  const xpAtLevelStart = (((level - 1) * level) / 2) * 100
  const xpRequiredForLevel = level * 100
  const xpInCurrentLevel = Math.max(0, totalXp - xpAtLevelStart)

  return {
    level,
    xpInCurrentLevel,
    xpRequiredForLevel,
    totalXp,
  }
}
