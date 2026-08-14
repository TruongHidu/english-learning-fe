import type { CSSProperties } from 'react'

export type AppSection =
  | 'learn'
  | 'pronunciation'
  | 'leaderboard'
  | 'quests'
  | 'shop'

interface SampleCardData {
  eyebrow: string
  title: string
  description: string
  progress?: number
  action?: string
}

interface SectionData {
  eyebrow: string
  title: string
  placeholder: string
  cards: SampleCardData[]
}

const sectionData: Record<AppSection, SectionData> = {
  learn: {
    eyebrow: 'LỘ TRÌNH CỦA BẠN',
    title: 'Học',
    placeholder: 'Nội dung bài học sẽ hiển thị tại đây.',
    cards: [
      {
        eyebrow: 'TIẾN ĐỘ HÔM NAY',
        title: 'Hoàn thành bài học đầu tiên',
        description: 'Bắt đầu một bài học để duy trì thói quen mỗi ngày.',
        progress: 0,
      },
      {
        eyebrow: 'NHIỆM VỤ HẰNG NGÀY',
        title: 'Kiếm 10 KN',
        description: '0 / 10 KN đã hoàn thành hôm nay.',
        progress: 0,
      },
      {
        eyebrow: 'GÓI HỌC TẬP',
        title: 'Thử Super miễn phí',
        description: 'Học không quảng cáo và luyện tập không giới hạn.',
        action: 'XEM CHI TIẾT',
      },
    ],
  },
  pronunciation: {
    eyebrow: 'LUYỆN KỸ NĂNG',
    title: 'Phát âm',
    placeholder: 'Các bài luyện phát âm sẽ hiển thị tại đây.',
    cards: [
      {
        eyebrow: 'MỤC TIÊU PHÁT ÂM',
        title: 'Luyện 5 phút mỗi ngày',
        description: 'Hoàn thành bài luyện đầu tiên để bắt đầu theo dõi tiến độ.',
        progress: 0,
      },
      {
        eyebrow: 'GỢI Ý',
        title: 'Âm cơ bản',
        description: 'Bắt đầu với những âm thường gặp trong tiếng Anh.',
        action: 'XEM BÀI LUYỆN',
      },
    ],
  },
  leaderboard: {
    eyebrow: 'THI ĐUA CÙNG BẠN BÈ',
    title: 'Bảng xếp hạng',
    placeholder: 'Bảng xếp hạng tuần sẽ hiển thị tại đây.',
    cards: [
      {
        eyebrow: 'GIẢI ĐẤU TUẦN NÀY',
        title: 'Chưa mở khóa',
        description: 'Hoàn thành thêm 3 bài học để bắt đầu thi đua.',
        progress: 25,
      },
      {
        eyebrow: 'THỜI GIAN CÒN LẠI',
        title: '6 ngày',
        description: 'Học thêm để tăng hạng trước khi tuần kết thúc.',
      },
    ],
  },
  quests: {
    eyebrow: 'MỤC TIÊU CỦA BẠN',
    title: 'Nhiệm vụ',
    placeholder: 'Danh sách nhiệm vụ sẽ hiển thị tại đây.',
    cards: [
      {
        eyebrow: 'NHIỆM VỤ HẰNG NGÀY',
        title: 'Kiếm 10 KN',
        description: 'Hoàn thành bài học để nhận phần thưởng.',
        progress: 0,
      },
      {
        eyebrow: 'HUY HIỆU THÁNG',
        title: 'Thử thách tháng này',
        description: 'Hoàn thành 20 nhiệm vụ để nhận huy hiệu đặc biệt.',
        progress: 0,
      },
    ],
  },
  shop: {
    eyebrow: 'VẬT PHẨM HỌC TẬP',
    title: 'Cửa hàng',
    placeholder: 'Các vật phẩm trong cửa hàng sẽ hiển thị tại đây.',
    cards: [
      {
        eyebrow: 'SỐ DƯ',
        title: 'Kim cương của bạn',
        description: 'Dùng kim cương để mở khóa các vật phẩm hỗ trợ học tập.',
      },
      {
        eyebrow: 'GỢI Ý HÔM NAY',
        title: 'Hồi phục trái tim',
        description: 'Vật phẩm mẫu sẽ xuất hiện tại đây.',
        action: 'XEM VẬT PHẨM',
      },
    ],
  },
}

export default function AppSectionPage({ section }: { section: AppSection }) {
  const content = sectionData[section]

  return (
    <>
      <main className="section-main">
        <header className="section-heading">
          <span>{content.eyebrow}</span>
          <h1>{content.title}</h1>
        </header>

        <div className="section-content-placeholder">
          <div>
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <rect x="8" y="10" width="48" height="44" rx="8" />
              <path d="M19 24h26M19 33h20M19 42h15" />
            </svg>
            <p>{content.placeholder}</p>
          </div>
        </div>
      </main>

      <aside className="right-rail" aria-label={`Thông tin ${content.title}`}>
        {content.cards.map((card) => (
          <article className="sample-card" key={`${section}-${card.title}`}>
            <span className="sample-card__eyebrow">{card.eyebrow}</span>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            {card.progress !== undefined && (
              <div
                className="sample-card__progress"
                role="progressbar"
                aria-label={card.title}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={card.progress}
              >
                <span style={{ '--sample-progress': `${card.progress}%` } as CSSProperties} />
              </div>
            )}
            {card.action && (
              <div className="sample-card__action">{card.action}</div>
            )}
          </article>
        ))}
      </aside>
    </>
  )
}
