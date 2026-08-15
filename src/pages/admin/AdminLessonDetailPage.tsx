import { useParams } from 'react-router-dom'
import MockNotice from '../../components/admin/MockNotice'
import PageHeader from '../../components/admin/PageHeader'
import StatusBadge from '../../components/admin/StatusBadge'
import { mockLesson } from '../../mocks/admin.mock'

export default function AdminLessonDetailPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  return (
    <div className="admin-page">
      <PageHeader eyebrow="Nội dung học" title="Chi tiết màn học" description={`Lesson ID: ${lessonId ?? 'demo'}`} action={<StatusBadge status="DRAFT" />} />
      <MockNotice />
      <section className="admin-card"><div className="admin-card__header"><div><h2>Lesson UI skeleton</h2><p>Trang này giữ route hierarchy để sẵn sàng kết nối Lesson API.</p></div></div><dl className="admin-detail-list"><div><dt>Tên màn học</dt><dd>{mockLesson.name}</dd></div><div><dt>Thứ tự</dt><dd>#{mockLesson.order}</dd></div><div><dt>Loại</dt><dd>{mockLesson.type}</dd></div><div><dt>Trạng thái</dt><dd><StatusBadge status={mockLesson.status} /></dd></div></dl></section>
    </div>
  )
}
