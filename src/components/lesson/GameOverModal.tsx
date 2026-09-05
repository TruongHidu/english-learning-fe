import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { shopService } from '../../services/shop.service'
import { getShopErrorMessage } from '../../utils/shop-errors'

interface GameOverModalProps {
  isOpen: boolean
  courseId?: string
  sectionId?: string
  nextHeartAt?: string | null
  onRetry: () => void
  onDismiss?: () => void
}

interface ShopInfo {
  diamond: number
  heartCost: number
  canAfford: boolean
}

function formatRemainingTime(nextHeartAt?: string | null, now = Date.now()): string | null {
  if (!nextHeartAt) return null
  const remaining = Math.max(0, new Date(nextHeartAt).getTime() - now)
  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0')
}

// Duolingo 3D Isometric Blue Gem
function DuolingoGemIcon({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M14 2L24.5 8.1V20L14 26.1L3.5 20V8.1L14 2Z" fill="#0284C7" />
      <path d="M14 3L23 8.2L14 13.4L5 8.2L14 3Z" fill="#38BDF8" />
      <path d="M5 8.2L14 13.4V24.5L5 19.3V8.2Z" fill="#0EA5E9" />
      <path d="M14 13.4L23 8.2V19.3L14 24.5V13.4Z" fill="#0284C7" />
      <path d="M14 4.5L20.5 8.2L14 11.9L7.5 8.2L14 4.5Z" fill="#7DD3FC" fillOpacity="0.85" />
    </svg>
  )
}

// Subdued / Gray Gem Icon for Refill card
function GrayGemIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M14 2L24.5 8.1V20L14 26.1L3.5 20V8.1L14 2Z" fill="#475569" />
      <path d="M14 3L23 8.2L14 13.4L5 8.2L14 3Z" fill="#94A3B8" />
      <path d="M5 8.2L14 13.4V24.5L5 19.3V8.2Z" fill="#64748B" />
      <path d="M14 13.4L23 8.2V19.3L14 24.5V13.4Z" fill="#475569" />
      <path d="M14 4.5L20.5 8.2L14 11.9L7.5 8.2L14 4.5Z" fill="#CBD5E1" fillOpacity="0.8" />
    </svg>
  )
}

// Super Infinity Heart Icon with radiant gradient
function SuperHeartIcon({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="superHeartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d2ff" />
          <stop offset="35%" stopColor="#2563eb" />
          <stop offset="70%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <path
        d="M18 31.5C18 31.5 4.5 23.5 4.5 13.5C4.5 8.5 8.5 5 13 5C15.8 5 17.5 6.8 18 7.5C18.5 6.8 20.2 5 23 5C27.5 5 31.5 8.5 31.5 13.5C31.5 23.5 18 31.5 18 31.5Z"
        fill="url(#superHeartGrad)"
      />
      <text
        x="18"
        y="17"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        fontSize="17"
        fontWeight="900"
        fontFamily="sans-serif"
      >
        ∞
      </text>
    </svg>
  )
}

// Gray / Subdued Heart Icon
function GrayHeartIcon({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M18 31.5C18 31.5 4.5 23.5 4.5 13.5C4.5 8.5 8.5 5 13 5C15.8 5 17.5 6.8 18 7.5C18.5 6.8 20.2 5 23 5C27.5 5 31.5 8.5 31.5 13.5C31.5 23.5 18 31.5 18 31.5Z"
        fill="#F1F5F9"
        stroke="#CBD5E1"
        strokeWidth="2.5"
      />
    </svg>
  )
}

// Selected checkmark badge (blue circle with white checkmark)
function SelectedBadge() {
  return (
    <div className="absolute -top-2.5 -right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#1cb0f6] shadow-md">
      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  )
}

export default function GameOverModal({
  isOpen,
  courseId,
  sectionId,
  nextHeartAt,
  onRetry,
  onDismiss,
}: GameOverModalProps) {
  const navigate = useNavigate()
  const { user, updateCachedUser } = useAuth()
  const [now, setNow] = useState(() => Date.now())
  const [shopInfo, setShopInfo] = useState<ShopInfo | null>(null)
  const [shopError, setShopError] = useState('')
  const [isPurchasing, setIsPurchasing] = useState(false)
  const [purchaseError, setPurchaseError] = useState('')
  const [selectedOption, setSelectedOption] = useState<'super' | 'refill'>('super')
  const [superNotice, setSuperNotice] = useState('')

  const remainingTime = formatRemainingTime(nextHeartAt, now)
  const backUrl = courseId && sectionId ? `/learn/courses/${courseId}/sections/${sectionId}` : '/learn'

  // Diamond balance (from shop info or cached user profile)
  const diamondBalance = shopInfo?.diamond ?? user?.stats?.diamond ?? 0
  const heartCost = shopInfo?.heartCost ?? 450

  // Countdown timer
  useEffect(() => {
    if (!isOpen || !nextHeartAt) return
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [isOpen, nextHeartAt])

  // Load shop info when modal opens
  useEffect(() => {
    if (!isOpen) return
    setNow(Date.now())
    setShopError('')
    setPurchaseError('')
    setSuperNotice('')
    setSelectedOption('super')
    setShopInfo(null)

    void shopService
      .getShop()
      .then((shop) => {
        const heartItem = shop.items.find((item) => item.type === 'HEART')
        if (heartItem) {
          setShopInfo({
            diamond: shop.user.diamond,
            heartCost: heartItem.diamondCost,
            canAfford: shop.user.diamond >= heartItem.diamondCost,
          })
        }
      })
      .catch((error) => setShopError(getShopErrorMessage(error, 'Không thể tải thông tin cửa hàng.')))
  }, [isOpen])

  async function handlePurchaseHeart() {
    if (isPurchasing) return
    setPurchaseError('')
    setIsPurchasing(true)
    try {
      const result = await shopService.purchaseHeart()
      updateCachedUser({
        stats: {
          currentHeart: result.hearts.current,
          maxHeart: result.hearts.max,
          nextHeartAt: result.hearts.nextHeartAt,
          diamond: result.diamond.after,
        },
      })
      onRetry()
    } catch (error) {
      setPurchaseError(getShopErrorMessage(error, 'Không thể mua tim. Vui lòng thử lại.'))
    } finally {
      setIsPurchasing(false)
    }
  }

  function handlePrimaryAction() {
    if (selectedOption === 'super') {
      // Super Duolingo trial action
      setSuperNotice('Tính năng Super đang được phát triển. Vui lòng chọn "Hồi phục" bằng kim cương để tiếp tục!')
      setSelectedOption('refill')
      return
    }

    // Refill option
    if (shopInfo && !shopInfo.canAfford) {
      navigate('/shop')
      return
    }

    void handlePurchaseHeart()
  }

  function handleDismiss() {
    if (onDismiss) {
      onDismiss()
    } else {
      navigate(backUrl)
    }
  }

  if (!isOpen) return null

  // Determine button text
  let primaryButtonText = 'THỬ 1 TUẦN MIỄN PHÍ'
  if (selectedOption === 'refill') {
    if (isPurchasing) {
      primaryButtonText = 'ĐANG HỒI PHỤC...'
    } else if (shopInfo && !shopInfo.canAfford) {
      primaryButtonText = 'MUA KIM CƯƠNG'
    } else {
      primaryButtonText = 'HỒI PHỤC TIM'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-[420px] rounded-[32px] bg-white px-6 pt-5 pb-7 shadow-2xl sm:px-7 sm:pt-6 sm:pb-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-over-title"
      >
        {/* Top Right: Duolingo Diamond Balance */}
        <div className="mb-2 flex items-center justify-end gap-1.5" aria-label={`Số kim cương hiện có: ${diamondBalance}`}>
          <DuolingoGemIcon className="h-6 w-6" />
          <span className="text-lg font-black text-[#1cb0f6]">{diamondBalance}</span>
        </div>

        {/* Title */}
        <h2
          id="game-over-title"
          className="mb-6 text-center text-[26px] font-black tracking-tight text-[#3c3c3c] sm:text-[28px]"
        >
          Bạn đã hết trái tim!
        </h2>

        {/* Options List */}
        <div className="mb-6 flex flex-col gap-3.5" role="radiogroup" aria-label="Tùy chọn tiếp tục">
          {/* Option 1: SUPER - Trái tim vô hạn */}
          {selectedOption === 'super' ? (
            <div
              role="radio"
              aria-checked="true"
              tabIndex={0}
              onClick={() => {
                setSelectedOption('super')
                setSuperNotice('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedOption('super')
                  setSuperNotice('')
                }
              }}
              className="relative cursor-pointer rounded-[22px] bg-gradient-to-r from-[#00d2ff] via-[#8b5cf6] to-[#ec4899] p-[2.5px] shadow-sm transition-transform active:scale-[0.99]"
            >
              {/* Green SUPER badge on top-left */}
              <div className="absolute -top-3 left-2.5 z-10 flex items-center justify-center rounded-t-lg rounded-br-lg bg-[#00cd9c] px-3 py-0.5 shadow-sm">
                <span className="text-[11px] font-black italic tracking-widest text-white">SUPER</span>
              </div>

              {/* Blue Selected Checkmark Badge */}
              <SelectedBadge />

              {/* Inner Card Content */}
              <div className="flex items-center justify-between rounded-[19.5px] bg-white px-4 py-3.5 sm:px-5 sm:py-4">
                <div className="flex items-center gap-3">
                  <SuperHeartIcon />
                  <span className="text-[16px] font-black text-[#3c3c3c]">Trái tim vô hạn</span>
                </div>
                <span className="text-[13px] font-black tracking-wide text-[#d81b85]">DÙNG SUPER</span>
              </div>
            </div>
          ) : (
            <div
              role="radio"
              aria-checked="false"
              tabIndex={0}
              onClick={() => {
                setSelectedOption('super')
                setSuperNotice('')
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedOption('super')
                  setSuperNotice('')
                }
              }}
              className="relative cursor-pointer rounded-[22px] border-2 border-slate-200 bg-white p-[0.5px] transition hover:border-slate-300"
            >
              {/* Green SUPER badge */}
              <div className="absolute -top-3 left-2.5 z-10 flex items-center justify-center rounded-t-lg rounded-br-lg bg-[#00cd9c] px-3 py-0.5 shadow-sm">
                <span className="text-[11px] font-black italic tracking-widest text-white">SUPER</span>
              </div>

              <div className="flex items-center justify-between px-4 py-3.5 sm:px-5 sm:py-4">
                <div className="flex items-center gap-3">
                  <SuperHeartIcon />
                  <span className="text-[16px] font-black text-[#3c3c3c]">Trái tim vô hạn</span>
                </div>
                <span className="text-[13px] font-black tracking-wide text-[#d81b85]">DÙNG SUPER</span>
              </div>
            </div>
          )}

          {/* Option 2: Hồi phục */}
          {selectedOption === 'refill' ? (
            <div
              role="radio"
              aria-checked="true"
              tabIndex={0}
              onClick={() => setSelectedOption('refill')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedOption('refill')
              }}
              className="relative flex cursor-pointer items-center justify-between rounded-[22px] border-2 border-[#1cb0f6] bg-[#f0f9ff] px-4 py-3.5 shadow-sm transition sm:px-5 sm:py-4"
            >
              <SelectedBadge />

              <div className="flex items-center gap-3">
                <GrayHeartIcon />
                <div>
                  <span className="text-[16px] font-black text-slate-800">Hồi phục</span>
                  {remainingTime && (
                    <p className="text-[11px] font-bold text-slate-400">Tim kế tiếp sau {remainingTime}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[15px] font-black text-sky-600">
                <DuolingoGemIcon className="h-5 w-5" />
                <span>{heartCost}</span>
              </div>
            </div>
          ) : (
            <div
              role="radio"
              aria-checked="false"
              tabIndex={0}
              onClick={() => setSelectedOption('refill')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedOption('refill')
              }}
              className="relative flex cursor-pointer items-center justify-between rounded-[22px] border-2 border-[#e5e5e5] bg-white px-4 py-3.5 transition hover:border-slate-300 hover:bg-slate-50/50 sm:px-5 sm:py-4"
            >
              <div className="flex items-center gap-3">
                <GrayHeartIcon />
                <span className="text-[16px] font-black text-[#4b4b4b]">Hồi phục</span>
              </div>

              <div className="flex items-center gap-1.5 text-[15px] font-black text-slate-500">
                <GrayGemIcon />
                <span>{heartCost}</span>
              </div>
            </div>
          )}
        </div>

        {/* Feedback / Notifications / Errors */}
        {superNotice && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-center text-xs font-bold text-amber-700">
            {superNotice}
          </div>
        )}

        {(purchaseError || shopError) && (
          <div
            className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-center text-xs font-bold text-rose-600"
            role="alert"
          >
            {purchaseError || shopError}
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-2.5">
          {/* Primary Action Button (Duolingo 3D Button) */}
          <button
            type="button"
            id="btn-primary-action"
            onClick={handlePrimaryAction}
            disabled={isPurchasing}
            className="w-full rounded-[20px] bg-[#1cb0f6] py-4 text-center text-[15px] font-black uppercase tracking-wider text-white shadow-[0_4px_0_#1899d6] transition-all hover:bg-[#20b8ff] active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {primaryButtonText}
          </button>

          {/* Secondary Action: KHÔNG, CẢM ƠN */}
          <button
            type="button"
            id="btn-secondary-action"
            onClick={handleDismiss}
            className="w-full py-2.5 text-center text-[15px] font-black uppercase tracking-wider text-[#1cb0f6] transition hover:text-[#0fa0e6]"
          >
            KHÔNG, CẢM ƠN
          </button>
        </div>

        {/* Subtle Next Heart Countdown (if available) */}
        {remainingTime && remainingTime !== '00:00' && selectedOption !== 'refill' && (
          <p className="mt-1 text-center text-[11px] font-semibold text-slate-400">
            Tim tiếp theo sẽ tự hồi phục sau <span className="font-bold text-slate-600">{remainingTime}</span>
          </p>
        )}
      </div>
    </div>
  )
}

