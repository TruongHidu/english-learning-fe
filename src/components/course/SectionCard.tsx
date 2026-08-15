import type { SectionResponse } from '../../types/course.types'

interface SectionCardProps {
  section: SectionResponse
}

export default function SectionCard({ section }: SectionCardProps) {
  return (
    <article className="bg-white rounded-2xl p-5 border-2 border-slate-200 shadow-[0_4px_0_#e2e8f0] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center font-black text-lg shrink-0">
          {section.orderIndex}
        </div>
        <div>
          <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider block mb-0.5">
            PHẦN {section.orderIndex}
          </span>
          <h3 className="text-base md:text-lg font-extrabold text-slate-800 mb-1">
            {section.name}
          </h3>
          {section.description ? (
            <p className="text-sm text-slate-600 leading-relaxed">
              {section.description}
            </p>
          ) : (
            <p className="text-sm text-slate-400 italic">Chưa có mô tả chi tiết.</p>
          )}
        </div>
      </div>

      <div className="w-full md:w-auto shrink-0">
        <button
          type="button"
          disabled
          className="w-full md:w-auto px-5 py-2.5 rounded-xl font-extrabold text-xs text-slate-500 bg-slate-100 border border-slate-200 cursor-not-allowed uppercase tracking-wider text-center flex items-center justify-center gap-2"
        >
          <span>⏳</span>
          <span>Sắp có bài học</span>
        </button>
      </div>
    </article>
  )
}
