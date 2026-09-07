import api from '../api/axios'
import type {
  DiamondPackage,
  CreateDiamondPackagePayload,
  UpdateDiamondPackagePayload,
} from '../types/diamond-package.types'

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export const adminDiamondPackageService = {
  async getPackages(): Promise<DiamondPackage[]> {
    const res = await api.get<ApiResponse<DiamondPackage[]>>('/admin/diamond-packages')
    return res.data.data
  },

  async getPackageById(id: string): Promise<DiamondPackage> {
    const res = await api.get<ApiResponse<DiamondPackage>>(`/admin/diamond-packages/${id}`)
    return res.data.data
  },

  async createPackage(payload: CreateDiamondPackagePayload): Promise<DiamondPackage> {
    const res = await api.post<ApiResponse<DiamondPackage>>('/admin/diamond-packages', payload)
    return res.data.data
  },

  async updatePackage(id: string, payload: UpdateDiamondPackagePayload): Promise<DiamondPackage> {
    const res = await api.patch<ApiResponse<DiamondPackage>>(`/admin/diamond-packages/${id}`, payload)
    return res.data.data
  },

  async deletePackage(id: string): Promise<void> {
    await api.delete(`/admin/diamond-packages/${id}`)
  },
}
