export type ShopDisabledReason = 'HEART_ALREADY_FULL' | 'INSUFFICIENT_DIAMOND' | null

export interface ShopUserBalance {
  diamond: number
  currentHeart: number
  maxHeart: number
  nextHeartAt: string | null
}

export interface ShopItem {
  id: string
  type: 'HEART'
  name: string
  description: string
  quantity: number
  diamondCost: number
  available: boolean
  disabledReason: ShopDisabledReason
}

export interface ShopDiamondPackage {
  id: string
  name: string
  diamondAmount: number
  bonusDiamond: number
  totalDiamond: number
  price: number
  currency: 'VND'
  description?: string
  orderIndex: number
}

export interface ShopData {
  user: ShopUserBalance
  items: ShopItem[]
  diamondPackages: ShopDiamondPackage[]
}

export interface PurchaseHeartData {
  purchase: { item: 'HEART'; quantity: number; diamondCost: number; transactionId: string }
  hearts: { current: number; max: number; nextHeartAt: string | null }
  diamond: { before: number; after: number }
}

export interface ShopApiResponse { success: true; message: string; data: ShopData }
export interface PurchaseHeartApiResponse { success: true; message: string; data: PurchaseHeartData }
