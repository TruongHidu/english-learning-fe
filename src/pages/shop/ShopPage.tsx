import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../hooks/useAuth'
import { queryClient } from '../../lib/queryClient'
import { shopService } from '../../services/shop.service'
import type { ShopData, ShopItem } from '../../types/shop.types'
import { getShopErrorMessage } from '../../utils/shop-errors'
import './ShopPage.css'

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫'
}

/* ==========================================================================
   SVG Vector Illustrations
   ========================================================================== */

function HeartIllustration() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <radialGradient id="heartShine" cx="35%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#ff7676" />
          <stop offset="60%" stopColor="#ff4b4b" />
          <stop offset="100%" stopColor="#d92424" />
        </radialGradient>
        <filter id="heartShadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#991b1b" floodOpacity="0.25" />
        </filter>
      </defs>
      <path
        d="M32 56S8 42 8 23.5C8 14.4 15.3 7 24.3 7c5 0 9.6 2.3 12.7 6 3.1-3.7 7.7-6 12.7-6C58.7 7 66 14.4 66 23.5 66 42 42 56 32 56Z"
        transform="translate(-5, 0)"
        fill="url(#heartShine)"
        filter="url(#heartShadow)"
      />
      {/* Specular highlights */}
      <ellipse cx="23" cy="18" rx="5" ry="3" transform="rotate(-30 23 18)" fill="#ffffff" opacity="0.6" />
      <circle cx="28" cy="13" r="1.5" fill="#ffffff" opacity="0.8" />
      {/* Little sparkle */}
      <polygon points="46,15 48,11 50,15 54,17 50,19 48,23 46,19 42,17" fill="#ffe4e6" />
    </svg>
  )
}

function SuperHeartIllustration() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="superGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00e5a3" />
          <stop offset="45%" stopColor="#1cb0f6" />
          <stop offset="80%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <path
        d="M32 56S8 42 8 23.5C8 14.4 15.3 7 24.3 7c5 0 9.6 2.3 12.7 6 3.1-3.7 7.7-6 12.7-6C58.7 7 66 14.4 66 23.5 66 42 42 56 32 56Z"
        transform="translate(-5, 0)"
        fill="url(#superGrad)"
      />
      {/* Glowing infinity sign */}
      <path
        d="M23 27c-3.3 0-6 2.5-6 5.5s2.7 5.5 6 5.5c3 0 5-2.5 7-5.5-2-3-4-5.5-7-5.5Zm18 0c-3 0-5 2.5-7 5.5 2 3 4 5.5 7 5.5 3.3 0 6-2.5 6-5.5s-2.7-5.5-6-5.5Z"
        stroke="#ffffff"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

function StreakFreezeIllustration() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="iceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#bbf7d0" />
          <stop offset="50%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      {/* Ice Shield shape */}
      <path
        d="M32 6L14 13v19c0 14.5 7.7 22.8 18 26 10.3-3.2 18-11.5 18-26V13L32 6Z"
        fill="url(#iceGrad)"
      />
      <path
        d="M32 10L18 16v16c0 12 6.3 18.8 14 21.5 7.7-2.7 14-9.5 14-21.5V16L32 10Z"
        fill="#e0f2fe"
        opacity="0.35"
      />
      {/* Snowflake center */}
      <path
        d="M32 20v24M20 32h24M23 23l18 18M41 23L23 41"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

function DoubleXpIllustration() {
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="potionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#7e22ce" />
        </linearGradient>
      </defs>
      {/* Flask bottle */}
      <path
        d="M26 12h12v6l10 18c3 5.4.5 14-6 16H22c-6.5-2-9-10.6-6-16l10-18v-6Z"
        fill="url(#potionGrad)"
      />
      {/* Cork */}
      <rect x="27" y="6" width="10" height="6" rx="2" fill="#d97706" />
      {/* 2X text */}
      <text x="32" y="42" fill="#ffffff" fontSize="16" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
        2X
      </text>
    </svg>
  )
}

function GemChestIllustration() {
  return (
    <svg viewBox="0 0 64 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Chest body */}
      <rect x="6" y="24" width="52" height="28" rx="5" fill="#a05721" />
      <line x1="6" y1="36" x2="58" y2="36" stroke="#71370b" strokeWidth="2" />
      {/* Gold trims */}
      <rect x="6" y="24" width="6" height="28" fill="#ffc800" />
      <rect x="52" y="24" width="6" height="28" fill="#ffc800" />
      <rect x="6" y="24" width="52" height="4" fill="#e5a500" />
      <rect x="27" y="24" width="10" height="12" rx="2" fill="#ffc800" />
      <circle cx="32" cy="30" r="1.5" fill="#502c00" />
      {/* Overflowing gems */}
      <polygon points="18,18 26,8 34,16 30,24 22,24" fill="#38bdf8" />
      <polygon points="26,8 34,16 30,24 26,14" fill="#e0f2fe" />
      <polygon points="34,16 42,6 50,16 46,24 38,24" fill="#0ea5e9" />
      <polygon points="42,6 50,16 46,24 42,12" fill="#bae6fd" />
    </svg>
  )
}

function SmallGemIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m7 3-4 5v9l9 5 9-5V8l-4-5H7Z" fill="#1cb0f6" />
      <path d="m8 6-2 3v6l6 3.5 6-3.5V9l-2-3H8Z" fill="#9de4ff" />
    </svg>
  )
}

function MascotSuperHero() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="mascotGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00e5a3" />
          <stop offset="60%" stopColor="#1cb0f6" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      {/* Mascot circular avatar */}
      <circle cx="50" cy="50" r="42" fill="url(#mascotGrad)" />
      {/* Eyes */}
      <ellipse cx="40" cy="46" rx="8" ry="10" fill="#ffffff" />
      <circle cx="42" cy="46" r="4.5" fill="#1e293b" />
      <circle cx="44" cy="44" r="1.5" fill="#ffffff" />
      <ellipse cx="60" cy="46" rx="8" ry="10" fill="#ffffff" />
      <circle cx="62" cy="46" r="4.5" fill="#1e293b" />
      <circle cx="64" cy="44" r="1.5" fill="#ffffff" />
      {/* Beak / Nose */}
      <polygon points="50,54 44,60 56,60" fill="#f59e0b" />
      {/* Super Cape / Star */}
      <polygon points="50,14 53,22 61,22 55,27 57,35 50,30 43,35 45,27 39,22 47,22" fill="#ffd700" />
    </svg>
  )
}

/* ==========================================================================
   Main Component
   ========================================================================== */

export default function ShopPage() {
  const navigate = useNavigate()
  const { user, updateCachedUser } = useAuth()
  const [shop, setShop] = useState<ShopData | null>(null)
  const [loadError, setLoadError] = useState('')
  const [purchaseError, setPurchaseError] = useState('')
  const [notice, setNotice] = useState('')
  const [buying, setBuying] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  // Use React Query for GET /shop
  const {
    data: shopData,
    isLoading: isShopLoading,
    error: shopQueryError,
    refetch: refetchShop,
  } = useQuery({
    queryKey: ['shop'],
    queryFn: shopService.getShop,
  })

  useEffect(() => {
    if (shopData) {
      setShop(shopData)
      updateCachedUser({
        stats: {
          diamond: shopData.user.diamond,
          currentHeart: shopData.user.currentHeart,
          maxHeart: shopData.user.maxHeart,
          nextHeartAt: shopData.user.nextHeartAt,
        },
      })
    }
  }, [shopData, updateCachedUser])

  useEffect(() => {
    if (shopQueryError) {
      setLoadError(getShopErrorMessage(shopQueryError))
    } else {
      setLoadError('')
    }
  }, [shopQueryError])

  const loading = isShopLoading && !shop

  // Listen for real-time diamond updates from admin
  useEffect(() => {
    const handleDiamondUpdated = (event: Event) => {
      const detail = (event as CustomEvent).detail
      if (detail?.diamond !== undefined) {
        setShop((prev) => {
          if (!prev) return prev
          const newDiamond = Number(detail.diamond)
          const full = prev.user.currentHeart >= prev.user.maxHeart
          const updated: ShopData = {
            ...prev,
            user: {
              ...prev.user,
              diamond: newDiamond,
            },
            items: prev.items.map((item) => {
              if (item.type === 'HEART') {
                return {
                  ...item,
                  available: !full && newDiamond >= item.diamondCost,
                  status: full ? 'FULL' : newDiamond < item.diamondCost ? 'INSUFFICIENT_DIAMOND' : 'AVAILABLE',
                }
              }
              return item
            }),
          }
          queryClient.setQueryData(['shop'], updated)
          return updated
        })
      }
    }

    window.addEventListener('DIAMOND_UPDATED', handleDiamondUpdated)
    return () => window.removeEventListener('DIAMOND_UPDATED', handleDiamondUpdated)
  }, [])

  // Modal dialog states
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [isSuperModalOpen, setIsSuperModalOpen] = useState(false)
  const [isInsufficientModalOpen, setIsInsufficientModalOpen] = useState(false)

  const loadShop = useCallback(async () => {
    setLoadError('')
    try {
      await refetchShop()
    } catch (error) {
      setLoadError(getShopErrorMessage(error))
    }
  }, [refetchShop])

  // 2. Countdown timer for heart regeneration
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Auto-dismiss toast notice after 4 seconds
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(t)
  }, [notice])

  const heartItem: ShopItem | undefined = shop?.items.find((item) => item.type === 'HEART')

  const currentHearts = shop?.user.currentHeart ?? user?.stats.currentHeart ?? 0
  const maxHearts = shop?.user.maxHeart ?? user?.stats.maxHeart ?? 5
  const currentDiamonds = shop?.user.diamond ?? user?.stats.diamond ?? 0
  const isHeartFull = currentHearts >= maxHearts
  const heartCost = heartItem?.diamondCost ?? 20
  const hasEnoughDiamonds = currentDiamonds >= heartCost

  // Remaining time to next heart regen
  const nextHeartTarget = shop?.user.nextHeartAt ? new Date(shop.user.nextHeartAt).getTime() : null
  const remainingRegenMs = nextHeartTarget ? Math.max(0, nextHeartTarget - now) : 0
  const regenMinutes = Math.floor(remainingRegenMs / 60000)
  const regenSeconds = Math.floor((remainingRegenMs % 60000) / 1000)
  const formattedCountdown = `${String(regenMinutes).padStart(2, '0')}:${String(regenSeconds).padStart(2, '0')}`

  // Click on "Mua tim" trigger
  function handleInitiateHeartPurchase() {
    if (isHeartFull) return
    if (!hasEnoughDiamonds) {
      setIsInsufficientModalOpen(true)
      return
    }
    setIsConfirmModalOpen(true)
  }

  // Confirm and call API to purchase heart
  async function handleConfirmPurchaseHeart() {
    setBuying(true)
    setPurchaseError('')

    try {
      const result = await shopService.purchaseHeart()

      // 1. Update local state
      setShop((current) => {
        if (!current) return current
        const nextCurrentHeart = result.hearts.current
        const nextMaxHeart = result.hearts.max
        const nextDiamonds = result.diamond.after

        const updatedShop: ShopData = {
          ...current,
          user: {
            ...current.user,
            diamond: nextDiamonds,
            currentHeart: nextCurrentHeart,
            maxHeart: nextMaxHeart,
            nextHeartAt: result.hearts.nextHeartAt,
          },
          items: current.items.map((item) => {
            if (item.type !== 'HEART') return item
            const full = nextCurrentHeart >= nextMaxHeart
            return {
              ...item,
              available: !full && nextDiamonds >= item.diamondCost,
              disabledReason: full
                ? 'HEART_ALREADY_FULL'
                : nextDiamonds < item.diamondCost
                  ? 'INSUFFICIENT_DIAMOND'
                  : null,
            }
          }),
        }
        queryClient.setQueryData(['shop'], updatedShop)
        return updatedShop
      })

      // 2. Sync with global auth state to update navbar instantly
      updateCachedUser({
        stats: {
          diamond: result.diamond.after,
          currentHeart: result.hearts.current,
          maxHeart: result.hearts.max,
          nextHeartAt: result.hearts.nextHeartAt,
        },
      })

      setIsConfirmModalOpen(false)
      setNotice('Đã hồi phục 1 trái tim thành công!')
    } catch (error) {
      setPurchaseError(getShopErrorMessage(error, 'Mua tim thất bại.'))
    } finally {
      setBuying(false)
    }
  }

  return (
    <>
      <main className="shop-main-content">
        {/* ==================================================================
            Hero Banner (Super LingoFox)
            ================================================================== */}
        <header className="shop-hero-banner">
          <div>
            <span className="shop-hero-tag">LINGOFOX SUPER</span>
            <h1 className="shop-hero-title">Học tập không gián đoạn</h1>
            <p className="shop-hero-desc">
              Mở khóa Trái tim vô hạn và nhiều quyền lợi đặc quyền cùng LingoFox Super!
            </p>
            <button
              type="button"
              className="shop-hero-btn"
              onClick={() => setIsSuperModalOpen(true)}
            >
              DÙNG THỬ MIỄN PHÍ
            </button>
          </div>
          <div className="shop-hero-mascot-box">
            <MascotSuperHero />
          </div>
        </header>

        {/* ==================================================================
            Wallet Bar (Trạng thái số dư của người dùng)
            ================================================================== */}
        <section className="shop-wallet-card" aria-label="Số dư của bạn">
          <div className="shop-wallet-pill">
            <div className="shop-wallet-icon-box shop-wallet-icon-box--heart">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#ff4b4b">
                <path d="M12 21S3 16 3 9.5C3 6 7.4 4 10 7l2 2 2-2c2.6-3 7-1 7 2.5C21 16 12 21 12 21Z" />
              </svg>
            </div>
            <div className="shop-wallet-pill-info">
              <span className="shop-wallet-pill-label">Trái tim</span>
              <strong className="shop-wallet-pill-val shop-wallet-pill-val--heart">
                {currentHearts} / {maxHearts}
              </strong>
              {!isHeartFull && remainingRegenMs > 0 && (
                <span className="shop-wallet-regen-timer">
                  Hồi 1 tim sau {formattedCountdown}
                </span>
              )}
            </div>
          </div>

          <div className="shop-wallet-divider" />

          <div className="shop-wallet-pill">
            <div className="shop-wallet-icon-box shop-wallet-icon-box--diamond">
              <svg width="26" height="26" viewBox="0 0 24 24">
                <path d="m7 3-4 5v9l9 5 9-5V8l-4-5H7Z" fill="#1cb0f6" />
                <path d="m8 6-2 3v6l6 3.5 6-3.5V9l-2-3H8Z" fill="#9de4ff" />
              </svg>
            </div>
            <div className="shop-wallet-pill-info">
              <span className="shop-wallet-pill-label">Đá quý</span>
              <strong className="shop-wallet-pill-val shop-wallet-pill-val--diamond">
                {currentDiamonds}
              </strong>
            </div>
          </div>
        </section>

        {/* Loading skeleton or error */}
        {loading && (
          <div className="shop-loading-skeleton" aria-live="polite">
            <div className="shop-skeleton-card" />
            <div className="shop-skeleton-card" />
          </div>
        )}

        {loadError && (
          <div className="shop-card p-6 text-center border-2 border-rose-200 bg-rose-50 rounded-2xl mb-6">
            <p className="font-bold text-rose-600 mb-3">{loadError}</p>
            <button
              type="button"
              className="shop-buy-btn shop-buy-btn--active"
              onClick={() => void loadShop()}
            >
              THỬ LẠI
            </button>
          </div>
        )}

        {/* ==================================================================
            Section 1: Trái tim (Hearts)
            ================================================================== */}
        <section className="shop-section" aria-labelledby="hearts-heading">
          <div className="shop-section-heading">
            <h2 id="hearts-heading">Trái tim</h2>
            <p>Nạp lại trái tim để không phải lo lắng về lỗi sai trong các bài học.</p>
          </div>

          <div className="shop-items-list">
            {/* Item 1: Hồi phục Trái tim */}
            <article className="shop-item-card">
              <div className="shop-item-icon-wrapper">
                <HeartIllustration />
              </div>
              <div className="shop-item-details">
                <div className="shop-item-title-row">
                  <h3 className="shop-item-title">
                    {heartItem?.name ?? 'Hồi phục Trái tim'}
                  </h3>
                </div>
                <p className="shop-item-desc">
                  {heartItem?.description ?? 'Cộng một trái tim để tiếp tục học.'}
                </p>
                {!hasEnoughDiamonds && !isHeartFull && (
                  <p className="shop-item-warning">Bạn cần thêm kim cương để hồi phục tim.</p>
                )}
              </div>

              {/* Purchase Button */}
              {isHeartFull ? (
                <button
                  type="button"
                  className="shop-buy-btn shop-buy-btn--disabled"
                  disabled
                >
                  ĐẦY TIM
                </button>
              ) : hasEnoughDiamonds ? (
                <button
                  type="button"
                  className="shop-buy-btn shop-buy-btn--active"
                  onClick={handleInitiateHeartPurchase}
                  disabled={buying}
                >
                  <SmallGemIcon /> {heartCost} MUA
                </button>
              ) : (
                <button
                  type="button"
                  className="shop-buy-btn shop-buy-btn--insufficient"
                  onClick={handleInitiateHeartPurchase}
                >
                  <SmallGemIcon /> {heartCost}
                </button>
              )}
            </article>

            {/* Item 2: Trái tim Vô hạn */}
            <article className="shop-item-card">
              <div className="shop-item-icon-wrapper">
                <SuperHeartIllustration />
              </div>
              <div className="shop-item-details">
                <div className="shop-item-title-row">
                  <h3 className="shop-item-title">Trái tim vô hạn</h3>
                  <span className="shop-item-badge shop-item-badge--super">SUPER</span>
                </div>
                <p className="shop-item-desc">
                  Học tập thoải mái mà không bao giờ cạn kiệt tim cùng Super LingoFox!
                </p>
              </div>
              <button
                type="button"
                className="shop-buy-btn shop-buy-btn--super"
                onClick={() => setIsSuperModalOpen(true)}
              >
                THỬ MIỄN PHÍ
              </button>
            </article>
          </div>
        </section>

        {/* ==================================================================
            Section 2: Tăng sức mạnh (Power-ups)
            ================================================================== */}
        <section className="shop-section" aria-labelledby="powerups-heading">
          <div className="shop-section-heading">
            <h2 id="powerups-heading">Tăng sức mạnh</h2>
            <p>Các vật phẩm hỗ trợ duy trì thói quen và đẩy nhanh tiến độ học.</p>
          </div>

          <div className="shop-items-list">
            {/* Streak Freeze */}
            <article className="shop-item-card shop-item-card--muted">
              <div className="shop-item-icon-wrapper">
                <StreakFreezeIllustration />
              </div>
              <div className="shop-item-details">
                <div className="shop-item-title-row">
                  <h3 className="shop-item-title">Đóng băng Streak</h3>
                  <span className="shop-item-badge shop-item-badge--popular">PHỔ BIẾN</span>
                </div>
                <p className="shop-item-desc">
                  Bảo vệ chuỗi ngày học của bạn nếu bạn lỡ quên hoàn thành bài học một ngày.
                </p>
              </div>
              <button
                type="button"
                className="shop-buy-btn shop-buy-btn--disabled"
                disabled
              >
                SẮP RA MẮT
              </button>
            </article>

            {/* Double XP Potion */}
            <article className="shop-item-card shop-item-card--muted">
              <div className="shop-item-icon-wrapper">
                <DoubleXpIllustration />
              </div>
              <div className="shop-item-details">
                <div className="shop-item-title-row">
                  <h3 className="shop-item-title">Gấp đôi kinh nghiệm (15 phút)</h3>
                </div>
                <p className="shop-item-desc">
                  Nhận x2 điểm kinh nghiệm (XP) cho mọi bài học hoàn thành trong thời gian này.
                </p>
              </div>
              <button
                type="button"
                className="shop-buy-btn shop-buy-btn--disabled"
                disabled
              >
                SẮP RA MẮT
              </button>
            </article>
          </div>
        </section>

        {/* ==================================================================
            Section 3: Gói Đá quý (Gem Packs)
            ================================================================== */}
        <section className="shop-section" aria-labelledby="gems-heading">
          <div className="shop-section-heading">
            <h2 id="gems-heading">Gói Đá quý</h2>
            <p>Tích lũy thêm kim cương để sở hữu nhiều vật phẩm giá trị hơn.</p>
          </div>

          <div className="shop-gem-grid">
            {shop?.diamondPackages && shop.diamondPackages.length > 0 ? (
              shop.diamondPackages.map((pkg) => (
                <div className="shop-gem-card" key={pkg.id}>
                  {pkg.orderIndex === 2 && (
                    <span className="shop-gem-badge">PHỔ BIẾN NHẤT</span>
                  )}
                  {pkg.orderIndex === 3 && (
                    <span className="shop-gem-badge">GIÁ TỐT NHẤT</span>
                  )}
                  <div className="shop-gem-icon">
                    <GemChestIllustration />
                  </div>
                  <div className="shop-gem-amount">{pkg.diamondAmount.toLocaleString('vi-VN')} 💎</div>
                  <div
                    className={`shop-gem-bonus${pkg.bonusDiamond > 0 ? '' : ' shop-gem-bonus--empty'}`}
                    aria-hidden={pkg.bonusDiamond <= 0}
                  >
                    {pkg.bonusDiamond > 0 ? `+${pkg.bonusDiamond.toLocaleString('vi-VN')} 💎 thưởng` : '\u00a0'}
                  </div>
                  <div className="shop-gem-total">
                    Tổng: {pkg.totalDiamond.toLocaleString('vi-VN')} 💎
                  </div>
                  <div className="shop-gem-name" title={pkg.name}>{pkg.name}</div>
                  <div className="shop-gem-price">
                    {formatVnd(pkg.price)}
                  </div>
                  <p className="shop-gem-description" title={pkg.description || undefined}>
                    {pkg.description || '\u00a0'}
                  </p>
                  <button type="button" className="shop-gem-btn" disabled>
                    CHƯA HỖ TRỢ THANH TOÁN
                  </button>
                </div>
              ))
            ) : !loading ? (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#64748b', padding: '24px 0' }}>
                Hiện chưa có gói đá quý nào được mở bán.
              </p>
            ) : null}
          </div>
        </section>
      </main>

      {/* ==================================================================
          Right Rail Sidebar
          ================================================================== */}
      <aside className="shop-right-rail" aria-label="Tiện ích bổ sung">
        <div className="shop-rail-card">
          <div className="shop-rail-header">
            <h3 className="shop-rail-title">BẢNG XẾP HẠNG</h3>
          </div>
          <p>Luyện tập mỗi ngày để tích lũy XP và thăng hạng giải đấu tuần!</p>
          <button
            type="button"
            className="shop-rail-btn"
            onClick={() => navigate('/leaderboard')}
          >
            TỚI BẢNG XẾP HẠNG
          </button>
        </div>

        <div className="shop-rail-card">
          <div className="shop-rail-header">
            <h3 className="shop-rail-title">CÁCH KIẾM ĐÁ QUÝ</h3>
          </div>
          <p>
            Hoàn thành các bài học mới, duy trì chuỗi ngày streak và đạt top trên bảng xếp hạng để nhận thêm kim cương miễn phí!
          </p>
          <button
            type="button"
            className="shop-rail-btn"
            onClick={() => navigate('/learn')}
          >
            BẮT ĐẦU HỌC NGAY
          </button>
        </div>
      </aside>

      {/* ==================================================================
          Modal 1: Xác nhận mua tim bằng kim cương
          ================================================================== */}
      {isConfirmModalOpen && (
        <div className="shop-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
          <div className="shop-modal-dialog">
            <div className="shop-modal-icon-box">
              <HeartIllustration />
            </div>
            <h3 id="confirm-modal-title" className="shop-modal-title">Hồi phục 1 Trái tim?</h3>
            <p className="shop-modal-desc">
              Bạn có muốn dùng <strong>{heartCost} đá quý</strong> để nạp thêm 1 trái tim ngay lập tức không?
            </p>

            <div className="shop-modal-balance-box">
              <div className="shop-modal-balance-item">
                <small>Hiện có</small>
                <strong>{currentDiamonds} 💎</strong>
              </div>
              <div className="shop-modal-balance-arrow">➔</div>
              <div className="shop-modal-balance-item">
                <small>Sau khi mua</small>
                <strong>{Math.max(0, currentDiamonds - heartCost)} 💎</strong>
              </div>
            </div>

            {purchaseError && (
              <p className="text-sm font-bold text-rose-600 mb-4" role="alert">
                {purchaseError}
              </p>
            )}

            <div className="shop-modal-actions">
              <button
                type="button"
                className="shop-modal-confirm-btn"
                disabled={buying}
                onClick={() => void handleConfirmPurchaseHeart()}
              >
                {buying ? 'ĐANG XỬ LÝ…' : `MUA 1 TIM (${heartCost} 💎)`}
              </button>
              <button
                type="button"
                className="shop-modal-cancel-btn"
                disabled={buying}
                onClick={() => { setIsConfirmModalOpen(false); setPurchaseError('') }}
              >
                ĐỂ SAU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================
          Modal 2: Không đủ kim cương
          ================================================================== */}
      {isInsufficientModalOpen && (
        <div className="shop-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="insufficient-modal-title">
          <div className="shop-modal-dialog">
            <div className="shop-modal-icon-box">
              <svg width="72" height="72" viewBox="0 0 24 24">
                <path d="m7 3-4 5v9l9 5 9-5V8l-4-5H7Z" fill="#1cb0f6" />
                <path d="m8 6-2 3v6l6 3.5 6-3.5V9l-2-3H8Z" fill="#9de4ff" />
              </svg>
            </div>
            <h3 id="insufficient-modal-title" className="shop-modal-title">Không đủ Đá quý!</h3>
            <p className="shop-modal-desc">
              Bạn có <strong>{currentDiamonds} đá quý</strong> nhưng cần ít nhất <strong>{heartCost} đá quý</strong> để mua 1 trái tim.
            </p>
            <p className="text-sm text-slate-500 mb-6">
              Mẹo: Bạn có thể hoàn thành bài học hoặc đạt thứ hạng cao để kiếm thêm nhiều đá quý nhé!
            </p>
            <div className="shop-modal-actions">
              <button
                type="button"
                className="shop-modal-confirm-btn"
                onClick={() => { setIsInsufficientModalOpen(false); navigate('/learn') }}
              >
                ĐI HỌC KIẾM ĐÁ QUÝ
              </button>
              <button
                type="button"
                className="shop-modal-cancel-btn"
                onClick={() => setIsInsufficientModalOpen(false)}
              >
                ĐÓNG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================
          Modal 3: Giới thiệu Super LingoFox
          ================================================================== */}
      {isSuperModalOpen && (
        <div className="shop-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="super-modal-title">
          <div className="shop-modal-dialog">
            <div className="shop-modal-icon-box">
              <SuperHeartIllustration />
            </div>
            <h3 id="super-modal-title" className="shop-modal-title">LingoFox Super</h3>
            <p className="shop-modal-desc">Trải nghiệm phiên bản học tập tối ưu nhất.</p>

            <div className="shop-super-perks">
              <div className="shop-super-perk-item">
                <span className="shop-super-perk-check">✓</span>
                <span>Trái tim vô hạn — Không lo lỗi sai</span>
              </div>
              <div className="shop-super-perk-item">
                <span className="shop-super-perk-check">✓</span>
                <span>Không có quảng cáo gây gián đoạn</span>
              </div>
              <div className="shop-super-perk-item">
                <span className="shop-super-perk-check">✓</span>
                <span>Bài luyện tập cá nhân hóa chuyên sâu</span>
              </div>
            </div>

            <div className="shop-modal-actions">
              <button
                type="button"
                className="shop-modal-confirm-btn"
                style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)', boxShadow: '0 4px 0 #6d28d9' }}
                onClick={() => setIsSuperModalOpen(false)}
              >
                BẮT ĐẦU 14 NGÀY DÙNG THỬ
              </button>
              <button
                type="button"
                className="shop-modal-cancel-btn"
                onClick={() => setIsSuperModalOpen(false)}
              >
                QUAY LẠI CỬA HÀNG
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================
          Toast Notification
          ================================================================== */}
      {notice && (
        <aside className="shop-toast-banner" role="status">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#ffffff">
            <path d="M12 21S3 16 3 9.5C3 6 7.4 4 10 7l2 2 2-2c2.6-3 7-1 7 2.5C21 16 12 21 12 21Z" />
          </svg>
          <span>{notice}</span>
        </aside>
      )}
    </>
  )
}
