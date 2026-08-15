import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import DataTable from '../../components/admin/DataTable'
import PageHeader from '../../components/admin/PageHeader'
import StatusBadge from '../../components/admin/StatusBadge'
import LoadingState from '../../components/admin/LoadingState'
import ErrorState from '../../components/admin/ErrorState'
import { adminTopicService } from '../../services/admin-topic.service'
import { adminLessonService } from '../../services/admin-lesson.service'
import type { TopicResponse } from '../../types/topic.types'
import type { LessonResponse } from '../../types/lesson.types'

type TopicTab = 'overview' | 'lessons' | 'words' | 'questions'

export default function AdminTopicDetailPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const [tab, setTab] = useState<TopicTab>('overview')
  const [topic, setTopic] = useState<TopicResponse | null>(null)
  const [lessons, setLessons] = useState<LessonResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!topicId) return
    setIsLoading(true)
    setError(null)
    try {
      const [topicData, lessonsData] = await Promise.all([
        adminTopicService.getTopicById(topicId),
        adminLessonService.getLessonsByTopic(topicId)
      ])
      setTopic(topicData)
      setLessons(lessonsData)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu chủ đề.')
    } finally {
      setIsLoading(false)
    }
  }, [topicId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  if (isLoading) {
    return <div className="admin-page"><LoadingState label="Đang tải dữ liệu..." /></div>
  }

  if (error || !topic) {
    return (
      <div className="admin-page">
        <ErrorState title="Lỗi tải dữ liệu" message={error || 'Không tìm thấy chủ đề.'} onRetry={() => void loadData()} />
      </div>
    )
  }

  return (
    <div className="admin-page">
      <PageHeader eyebrow="Nội dung học" title={topic.name} description={`Topic ID: ${topic.id}`} action={<StatusBadge status={topic.status} size="md" />} />
      <div className="admin-tabs" role="tablist">{([['overview','Tổng quan'],['lessons','Màn học'],['words','Từ vựng'],['questions','Câu hỏi']] as const).map(([value,label]) => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)}>{label}</button>)}</div>
      
      {tab === 'overview' ? <section className="admin-card"><dl className="admin-detail-list"><div><dt>Topic name</dt><dd>{topic.name}</dd></div><div><dt>Thứ tự</dt><dd>#{topic.orderIndex}</dd></div><div><dt>Mô tả</dt><dd>{topic.description || 'Chưa có mô tả'}</dd></div><div><dt>Trạng thái</dt><dd><StatusBadge status={topic.status} /></dd></div></dl></section> : null}
      
      {tab === 'lessons' ? (
        <section className="admin-card">
          <div className="admin-card__header">
            <div><h2>Màn học</h2><p>Quản lý các màn học (lessons) trong topic này.</p></div>
            <button type="button" className="admin-button admin-button--primary">+ Thêm màn học</button>
          </div>
          {lessons.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Chưa có màn học nào.</div>
          ) : (
            <DataTable headers={['Tên màn học','Thứ tự','Loại','Trạng thái','Thao tác']} minWidth={600}>
              {lessons.map((lesson) => (
                <tr key={lesson.id}>
                  <td className="admin-table__primary">{lesson.name}</td>
                  <td>#{lesson.orderIndex}</td>
                  <td>Bài học</td>
                  <td><StatusBadge status={lesson.status} /></td>
                  <td><Link className="admin-button admin-button--secondary admin-button--small" to={`/admin/lessons/${lesson.id}`}>Xem chi tiết</Link></td>
                </tr>
              ))}
            </DataTable>
          )}
        </section>
      ) : null}
      {tab === 'words' ? <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Tính năng từ vựng đang được phát triển...</div> : null}
      {tab === 'questions' ? <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Tính năng câu hỏi đang được phát triển...</div> : null}
    </div>
  )
}
