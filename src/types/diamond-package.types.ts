export type DiamondPackageStatus = 'ACTIVE' | 'INACTIVE'

export interface DiamondPackage {
  id: string
  code: string
  name: string
  diamondAmount: number
  bonusDiamond: number
  totalDiamond: number
  price: number
  currency: 'VND'
  description?: string
  status: DiamondPackageStatus
  orderIndex: number
  createdAt: string
  updatedAt: string
}

export interface CreateDiamondPackagePayload {
  name: string
  diamondAmount: number
  bonusDiamond?: number
  price: number
  currency?: 'VND'
  description?: string
  status?: DiamondPackageStatus
  orderIndex?: number
}

export interface UpdateDiamondPackagePayload {
  name?: string
  diamondAmount?: number
  bonusDiamond?: number
  price?: number
  currency?: 'VND'
  description?: string
  status?: DiamondPackageStatus
  orderIndex?: number
}
