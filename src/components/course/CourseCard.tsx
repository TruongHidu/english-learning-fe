import type { CourseResponse } from '../../types/course.types'

interface CourseCardProps {
  course: CourseResponse
  onSelect: (course: CourseResponse) => void
}

export default function CourseCard({ course, onSelect }: CourseCardProps) {
  return (
    <article className="group bg-white rounded-2xl p-5 border-2 border-slate-200 hover:border-emerald-400 shadow-[0_4px_0_#e2e8f0] hover:shadow-[0_4px_0_#10b981] transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-100 text-emerald-800 tracking-wider">
            {course.level}
          </span>
          <span className="text-xs font-bold text-slate-400">
            Khóa #{course.orderIndex}
          </span>
        </div>

        <div className="w-full h-36 rounded-xl bg-slate-100 mb-4 overflow-hidden flex items-center justify-center border border-slate-200/60">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // Fallback to placeholder if broken image
                (e.target as HTMLElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="text-center p-4 text-slate-400">
              <span className="text-4xl block mb-1">🎓</span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {course.level}
              </span>
            </div>
          )}
        </div>

        <h3 className="text-lg font-extrabold text-slate-800 group-hover:text-emerald-600 transition-colors mb-1.5 line-clamp-1">
          {course.name}
        </h3>

        {course.description ? (
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-4">
            {course.description}
          </p>
        ) : (
          <p className="text-sm text-slate-400 italic mb-4">Chưa có mô tả chi tiết.</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => onSelect(course)}
        className="w-full py-2.5 px-4 font-black text-sm text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-[0_4px_0_#047857] active:translate-y-1 active:shadow-none transition-all cursor-pointer text-center uppercase tracking-wider"
      >
        Xem các phần học
      </button>
    </article>
  )
}
