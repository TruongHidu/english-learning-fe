import { useState } from 'react'
import { useParams } from 'react-router-dom'
import DataTable from '../../components/admin/DataTable'
import MockNotice from '../../components/admin/MockNotice'
import PageHeader from '../../components/admin/PageHeader'
import StatusBadge from '../../components/admin/StatusBadge'
import { mockQuestions, mockTopic, mockTopicVocabulary } from '../../mocks/admin.mock'

type TopicTab = 'overview' | 'lessons' | 'words' | 'questions'

export default function AdminTopicDetailPage() {
  const { topicId } = useParams<{ topicId: string }>()
  const [tab, setTab] = useState<TopicTab>('overview')
  return (
    <div className="admin-page">
      <PageHeader eyebrow="Nội dung học" title={mockTopic.name} description={`Topic ID: ${topicId ?? mockTopic.id}`} action={<StatusBadge status={mockTopic.status} size="md" />} />
      <MockNotice />
      <div className="admin-tabs" role="tablist">{([['overview','Tổng quan'],['lessons','Màn học'],['words','Từ vựng'],['questions','Câu hỏi']] as const).map(([value,label]) => <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)}>{label}</button>)}</div>
      {tab === 'overview' ? <section className="admin-card"><dl className="admin-detail-list"><div><dt>Topic name</dt><dd>{mockTopic.name}</dd></div><div><dt>Thứ tự</dt><dd>#{mockTopic.order}</dd></div><div><dt>Mô tả</dt><dd>{mockTopic.description}</dd></div><div><dt>Trạng thái</dt><dd><StatusBadge status={mockTopic.status} /></dd></div></dl></section> : null}
      {tab === 'lessons' ? <section className="admin-card"><div className="admin-card__header"><div><h2>Màn học</h2><p>Lesson backend chưa được triển khai.</p></div><button type="button" disabled className="admin-button admin-button--primary">+ Thêm màn học</button></div><DataTable headers={['Tên màn học','Thứ tự','Trạng thái','Thao tác']} minWidth={600}>{mockTopic.lessons.map((lesson,index) => <tr key={lesson}><td className="admin-table__primary">{lesson}</td><td>#{index + 1}</td><td><StatusBadge status="DRAFT" /></td><td><button type="button" className="admin-button admin-button--secondary admin-button--small" disabled>Chờ API</button></td></tr>)}</DataTable></section> : null}
      {tab === 'words' ? <DataTable headers={['Từ','Nghĩa','Phiên âm','Độ khó','Trạng thái']}>{mockTopicVocabulary.map((item) => <tr key={item.word}><td className="admin-table__primary">{item.word}</td><td>{item.meaning}</td><td>{item.phonetic}</td><td>{item.difficulty}</td><td><StatusBadge status={item.status} /></td></tr>)}</DataTable> : null}
      {tab === 'questions' ? <DataTable headers={['Câu hỏi','Loại','Độ khó','Trạng thái']}>{mockQuestions.slice(0,2).map((item) => <tr key={item.id}><td className="admin-table__primary">{item.question}</td><td>{item.type}</td><td>{item.difficulty}</td><td><StatusBadge status={item.status} /></td></tr>)}</DataTable> : null}
    </div>
  )
}
