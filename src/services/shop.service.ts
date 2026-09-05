import api from '../api/axios'
import type { PurchaseHeartApiResponse, PurchaseHeartData, ShopApiResponse, ShopData } from '../types/shop.types'
export const shopService = {
  async getShop(): Promise<ShopData> {
    const response = await api.get<ShopApiResponse>('/shop')
    return response.data.data
  },
  async purchaseHeart(): Promise<PurchaseHeartData> {
    const response = await api.post<PurchaseHeartApiResponse>('/shop/hearts/purchase', {})
    return response.data.data
  },
}
