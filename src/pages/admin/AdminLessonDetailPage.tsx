import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import PageHeader from '../../components/admin/PageHeader'
import StatusBadge from '../../components/admin/StatusBadge'
import LoadingState from '../../components/admin/LoadingState'
import ErrorState from '../../components/admin/ErrorState'
import { adminLessonService } from '../../services/admin-lesson.service'
import type { LessonResponse } from '../../types/lesson.types'

export default function AdminLessonDetailPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const [lesson, setLesson] = useState<LessonResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!lessonId) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await adminLessonService.getLessonById(lessonId)
      setLesson(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu màn học.')
    } finally {
      setIsLoading(false)
    }
  }, [lessonId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  if (isLoading) {
    return <div className="admin-page"><LoadingState label="Đang tải màn học..." /></div>
  }

  if (error || !lesson) {
    return (
      <div className="admin-page">
        <ErrorState title="Lỗi tải dữ liệu" message={error || 'Không tìm thấy màn học.'} onRetry={() => void loadData()} />
      </div>
    )
  }

  return (
    <div className="admin-page">
      <PageHeader eyebrow="Nội dung học" title={lesson.name} description={`Lesson ID: ${lesson.id}`} action={<StatusBadge status={lesson.status} />} />
      <section className="admin-card">
        <div className="admin-card__header">
          <div><h2>Thông tự chi tiết</h2><p>Quản lý các chỉ số và yêu cầu của màn học.</p></div>
        </div>
        <dl className="admin-detail-list">
          <div><dt>Tên màn học</dt><dd>{lesson.name}</dd></div>
          <div><dt>Thứ tự</dt><dd>#{lesson.orderIndex}</dd></div>
          <div><dt>Mô tả</dt><dd>{lesson.description || 'Chưa có mô tả'}</dd></div>
          <div><dt>Điểm qua màn</dt><dd>{lesson.requiredScore}%</dd></div>
          <div><dt>Số câu hỏi</dt><dd>{lesson.questionCount}</dd></div>
          <div><dt>Phần thưởng (XP)</dt><dd>{lesson.xpReward} XP</dd></div>
          <div><dt>Phần thưởng (Diamond)</dt><dd>{lesson.diamondReward} 💎</dd></div>
          <div><dt>Trạng thái</dt><dd><StatusBadge status={lesson.status} /></dd></div>
        </dl>
      </section>
    </div>
  )
}
