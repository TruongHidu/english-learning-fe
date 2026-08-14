import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8" />
      <path d="M8 11h6" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

export default function AdminDashboardPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <section className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 md:p-8 text-white shadow-sm">
        <div className="max-w-2xl">
          <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-black uppercase tracking-wider mb-3">
            Bảng điều khiển quản trị
          </span>
          <h1 className="text-2xl md:text-4xl font-black mb-2 tracking-tight">
            Xin chào, {user?.displayName || 'Admin'}! 👋
          </h1>
          <p className="text-emerald-100 text-sm md:text-base font-medium leading-relaxed">
            Chào mừng bạn đến với trung tâm quản trị LingoFox. Tại đây bạn có thể quản lý danh mục khóa học, thiết lập các phần học (sections) và kiểm soát trạng thái nội dung giảng dạy.
          </p>
        </div>
      </section>

      {/* Main Action Cards */}
      <section aria-labelledby="admin-modules-title">
        <h2 id="admin-modules-title" className="text-lg font-black text-slate-800 mb-4 uppercase tracking-wider">
          Phân hệ quản lý
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Course Management Card */}
          <Link
            to="/admin/courses"
            className="group block bg-white border-2 border-slate-200 hover:border-emerald-500 rounded-2xl p-6 shadow-[0_4px_0_#e2e8f0] hover:shadow-[0_4px_0_#10b981] transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border-2 border-emerald-100 group-hover:scale-105 transition-transform">
                <BookIcon />
              </div>
              <span className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all">
                <ArrowRightIcon />
              </span>
            </div>

            <h3 className="text-xl font-extrabold text-slate-800 mt-4 mb-2 group-hover:text-emerald-700 transition-colors">
              Quản lý khóa học
            </h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              Thêm mới, chỉnh sửa thông tin, phân cấp trình độ (A1-C2), quản lý các phần học (sections) và xuất bản khóa học ra hệ thống.
            </p>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center text-xs font-black text-emerald-600 uppercase tracking-wider">
              <span>Đi đến danh sách khóa học</span>
              <span className="ml-1">→</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Quick Tips / Admin Info */}
      <section className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-[0_4px_0_#e2e8f0]">
        <h2 className="text-base font-extrabold text-slate-800 mb-3 flex items-center gap-2">
          <span>💡</span>
          <span>Lưu ý vận hành nội dung</span>
        </h2>
        <ul className="space-y-2 text-sm text-slate-600 font-medium">
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold">•</span>
            <span>Khóa học ở trạng thái <strong>BẢN NHÁP (DRAFT)</strong> hoặc <strong>NGỪNG DÙNG (INACTIVE)</strong> sẽ tự động ẩn khỏi danh sách học của học viên.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold">•</span>
            <span>Để học viên có thể học, cả khóa học và các phần học (sections) bên trong đều cần được chuyển sang trạng thái <strong>ĐÃ PHÁT HÀNH (PUBLISHED)</strong>.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-emerald-600 font-bold">•</span>
            <span>Thứ tự hiển thị được sắp xếp dựa trên trường <code>orderIndex</code> (số thứ tự nhỏ hơn sẽ hiển thị trước).</span>
          </li>
        </ul>
      </section>
    </div>
  )
}
