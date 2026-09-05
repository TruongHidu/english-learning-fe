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

  async adjustDiamonds(userId: string, payload: AdminAdjustDiamondPayload) {
    const res = await api.post<AdminAdjustDiamondResponse>(`/admin/users/${userId}/adjust-diamonds`, payload)
    return res.data.data
  },

  async getTransactions(params?: { type?: string; userId?: string; page?: number; limit?: number }) {
    const res = await api.get<AdminDiamondTransactionsResponse>('/admin/diamond-transactions', { params })
    return res.data.data
  },
}
