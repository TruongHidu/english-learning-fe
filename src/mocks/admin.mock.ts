export const mockDashboardStats = [
  { label: 'Tổng người dùng', value: '1.250', note: '+8,2% so với tháng trước', tone: 'blue' as const },
  { label: 'Khóa học', value: '5', note: '3 khóa học đã xuất bản', tone: 'green' as const },
  { label: 'Màn học', value: '120', note: '18 màn học đang soạn', tone: 'violet' as const },
  { label: 'Doanh thu', value: '12.500.000 ₫', note: '+11,4% so với tháng trước', tone: 'amber' as const },
]

export const mockRecentActivities = [
  { id: 'a1', title: 'Khóa học English A1 vừa được cập nhật', time: '12 phút trước', type: 'Nội dung' },
  { id: 'a2', title: '24 người dùng mới đã đăng ký', time: '1 giờ trước', type: 'Người dùng' },
  { id: 'a3', title: 'Giao dịch PAY-240614 hoàn tất', time: '2 giờ trước', type: 'Thanh toán' },
]

export const mockAiQueue = [
  { id: 'ai1', topic: 'Daily routines', type: 'Vocabulary', count: 20, status: 'PENDING' as const },
  { id: 'ai2', topic: 'Food & drinks', type: 'Questions', count: 10, status: 'SUCCESS' as const },
]

export const mockQuestions = [
  { id: 'q1', question: 'Apple nghĩa là gì?', type: 'Multiple Choice', difficulty: 'Dễ', status: 'PUBLISHED' as const },
  { id: 'q2', question: 'Ghép từ với nghĩa tương ứng', type: 'Matching', difficulty: 'Trung bình', status: 'DRAFT' as const },
  { id: 'q3', question: 'Điền động từ thích hợp vào chỗ trống', type: 'Fill in blank', difficulty: 'Khó', status: 'PUBLISHED' as const },
]

export const mockAiHistory = [
  { id: 'h1', topic: 'Daily routines', type: 'Vocabulary', requested: 20, generated: 20, status: 'SUCCESS' as const, createdAt: '14/06/2026 09:20' },
  { id: 'h2', topic: 'Travel basics', type: 'Questions', requested: 15, generated: 0, status: 'PENDING' as const, createdAt: '14/06/2026 10:05' },
]

export const mockUsers = [
  { id: 'u1', name: 'Nguyễn Minh Anh', email: 'minhanh@example.com', level: 5, status: 'ACTIVE' as const, role: 'USER', heart: 5, diamond: 420, xp: 2450, streak: 12 },
  { id: 'u2', name: 'Trần Quốc Bảo', email: 'quocbao@example.com', level: 2, status: 'LOCKED' as const, role: 'USER', heart: 3, diamond: 90, xp: 720, streak: 0 },
  { id: 'u3', name: 'Lê Hải Yến', email: 'haiyen@example.com', level: 8, status: 'ACTIVE' as const, role: 'USER', heart: 5, diamond: 860, xp: 5940, streak: 31 },
]

export const mockUserProgress = [
  { course: 'English A1', completed: '28 / 36', progress: 78 },
  { course: 'Pronunciation Basics', completed: '9 / 20', progress: 45 },
]

export const mockLearnedWords = [
  { word: 'adventure', meaning: 'cuộc phiêu lưu', learnedAt: '10/06/2026', reviewedAt: '13/06/2026' },
  { word: 'confident', meaning: 'tự tin', learnedAt: '08/06/2026', reviewedAt: '12/06/2026' },
]

export const mockPayments = [
  { id: 'PAY-240614', user: 'Nguyễn Minh Anh', package: 'Túi kim cương', amount: 49000, method: 'MOMO', status: 'SUCCESS' as const, createdAt: '14/06/2026 10:24' },
  { id: 'PAY-240613', user: 'Lê Hải Yến', package: 'Rương kim cương', amount: 99000, method: 'VNPAY', status: 'PENDING' as const, createdAt: '13/06/2026 21:05' },
  { id: 'PAY-240612', user: 'Trần Quốc Bảo', package: 'Gói nhỏ', amount: 19000, method: 'BANKING', status: 'FAILED' as const, createdAt: '12/06/2026 16:42' },
]

export const mockDiamondPackages = [
  { id: 'p1', name: 'Gói nhỏ', diamonds: 100, price: 19000, status: 'ACTIVE' as const, popular: false },
  { id: 'p2', name: 'Túi kim cương', diamonds: 300, price: 49000, status: 'ACTIVE' as const, popular: true },
  { id: 'p3', name: 'Rương kim cương', diamonds: 700, price: 99000, status: 'INACTIVE' as const, popular: false },
]

export const mockRevenueStats = [
  { label: 'Tổng doanh thu', value: '128.500.000 ₫', note: 'Toàn thời gian', tone: 'green' as const },
  { label: 'Doanh thu tháng này', value: '12.500.000 ₫', note: '+11,4% so với tháng trước', tone: 'blue' as const },
  { label: 'Giao dịch thành công', value: '1.284', note: 'Tỷ lệ thành công 94,2%', tone: 'violet' as const },
  { label: 'Người dùng đã nạp', value: '846', note: '67,8% người dùng hoạt động', tone: 'amber' as const },
]

export const mockTopic = {
  id: 'topic-demo',
  name: 'Daily Life',
  description: 'Từ vựng và mẫu câu thường dùng trong sinh hoạt hằng ngày.',
  status: 'DRAFT' as const,
  order: 2,
  lessons: ['Morning routine', 'At school', 'After work'],
}

export const mockTopicVocabulary = [
  { word: 'routine', meaning: 'thói quen', phonetic: '/ruːˈtiːn/', difficulty: 'Dễ', status: 'DRAFT' as const },
]

export const mockLesson = {
  name: 'Morning routine',
  order: 1,
  type: 'Vocabulary',
  status: 'DRAFT' as const,
}
