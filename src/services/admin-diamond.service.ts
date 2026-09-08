import api from '../api/axios'

export interface AdminUserItem {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN'
  status: 'ACTIVE' | 'LOCKED' | 'BANNED'
  diamond: number
  currentHeart: number
  maxHeart: number
  totalXp: number
  currentStreak: number
  createdAt: string
}

export interface AdminUsersResponse {
  success: boolean
  data: {
    users: AdminUserItem[]
    total: number
    page: number
    totalPages: number
  }
}

export interface AdminUserDetail {
  id: string
  name: string
  email: string
  role: 'USER' | 'ADMIN'
  status: 'ACTIVE' | 'LOCKED' | 'BANNED'
  avatarUrl: string | null
  authProvider: string
  diamond: number
  currentHeart: number
  maxHeart: number
  totalXp: number
  level: number
  currentStreak: number
  longestStreak: number
  lastStudyDate: string | null
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminUserCourseProgress {
  courseId: string
  courseName: string
  level: string
  thumbnailUrl: string | null
  totalLessons: number
  completedLessons: number
  progressPercent: number
}

export interface AdminUserProgressData {
  totalCompletedLessons: number
  courses: AdminUserCourseProgress[]
}

export interface AdminUserVocabularyItem {
  id: string
  word: string
  meaning: string
  phonetic: string
  partOfSpeech: string
  difficulty: string
  status: 'LEARNED' | 'MASTERED'
  reviewLevel: number
  reviewCount: number
  correctCount: number
  incorrectCount: number
  learnedAt: string
  lastReviewedAt: string | null
}

export interface AdminUserVocabulariesData {
  vocabularies: AdminUserVocabularyItem[]
  total: number
  page: number
  totalPages: number
}

export interface AdminAdjustDiamondPayload {
  amount: number
  reason: string
}

export interface AdminAdjustDiamondResponse {
  success: boolean
  message: string
  data: {
    user: {
      id: string
      email: string
      name: string
      diamond: number
      currentHeart: number
    }
    transaction: {
      id: string
      amount: number
      balanceBefore: number
      balanceAfter: number
      description: string
      createdAt: string
    }
  }
}

export interface AdminDiamondTransactionItem {
  id: string
  userId: string
  userEmail: string
  userName: string
  amount: number
  type: 'BUY_HEART' | 'ADMIN_ADJUST' | 'TOP_UP' | 'LESSON_REWARD' | 'REWARD'
  balanceBefore: number
  balanceAfter: number
  description: string
  referenceType?: string
  referenceId?: string
  createdAt: string
}

export interface AdminDiamondTransactionsResponse {
  success: boolean
  data: {
    transactions: AdminDiamondTransactionItem[]
    total: number
    page: number
    totalPages: number
  }
}

export const adminDiamondService = {
  async getUsers(params?: { q?: string; status?: string; page?: number; limit?: number }) {
    const res = await api.get<AdminUsersResponse>('/admin/users', { params })
    return res.data.data
  },

  async getUserDetail(userId: string) {
    const res = await api.get<{ success: boolean; data: { user: AdminUserDetail } }>(`/admin/users/${userId}`)
    return res.data.data.user
  },

  async getUserProgress(userId: string) {
    const res = await api.get<{ success: boolean; data: AdminUserProgressData }>(`/admin/users/${userId}/progress`)
    return res.data.data
  },

  async getUserVocabularies(userId: string, params?: { page?: number; limit?: number }) {
    const res = await api.get<{ success: boolean; data: AdminUserVocabulariesData }>(`/admin/users/${userId}/vocabularies`, { params })
    return res.data.data
  },

  async updateUserStatus(userId: string, status: 'ACTIVE' | 'LOCKED' | 'BANNED', reason?: string) {
    const res = await api.patch<{ success: boolean; data: { id: string; name: string; email: string; status: 'ACTIVE' | 'LOCKED' | 'BANNED'; role: string } }>(
      `/admin/users/${userId}/status`,
      { status, reason }
    )
    return res.data.data
  },

  async adjustDiamonds(userId: string, payload: AdminAdjustDiamondPayload) {
    const res = await api.post<AdminAdjustDiamondResponse>(`/admin/users/${userId}/adjust-diamonds`, payload)
    return res.data.data
  },

  async getTransactions(params?: { type?: string; userId?: string; page?: number; limit?: number }) {
    const res = await api.get<AdminDiamondTransactionsResponse>('/admin/diamond-transactions', { params })
    return res.data.data
  },
}
