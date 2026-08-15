import { useState } from 'react'
import DataTable from '../../components/admin/DataTable'
import MockNotice from '../../components/admin/MockNotice'
import PageHeader from '../../components/admin/PageHeader'
import StatusBadge from '../../components/admin/StatusBadge'
import { mockAiHistory } from '../../mocks/admin.mock'

export default function AdminAIContentPage() {
  const [tab, setTab] = useState<'create' | 'history'>('create')
  const [topic, setTopic] = useState('')
  const [contentType, setContentType] = useState('Vocabulary')
  const [count, setCount] = useState(10)
  const [requirements, setRequirements] = useState('')
  const [message, setMessage] = useState('')

  return (
    <div className="admin-page">
      <PageHeader title="AI tạo nội dung" description="Chuẩn bị nội dung học theo chủ đề bằng trợ lý AI." />
      <MockNotice />
      <div className="admin-tabs" role="tablist" aria-label="AI Content tabs">
        <button type="button" role="tab" aria-selected={tab === 'create'} onClick={() => setTab('create')}>Tạo nội dung</button>
        <button type="button" role="tab" aria-selected={tab === 'history'} onClick={() => setTab('history')}>Lịch sử</button>
      </div>

      {tab === 'create' ? (
        <section className="admin-card">
          <div className="admin-card__header"><div><h2>Cấu hình yêu cầu</h2><p>Form chỉ lưu state phía giao diện và chưa gọi API.</p></div></div>
          {message ? <div className="admin-notification admin-notification--success"><span>{message}</span><button type="button" onClick={() => setMessage('')}>×</button></div> : null}
          <form className="admin-form-grid" onSubmit={(event) => { event.preventDefault(); setMessage('Chức năng AI sẽ được kết nối sau.') }}>
            <div className="admin-form-field"><label htmlFor="ai-topic">Chủ đề</label><select id="ai-topic" className="admin-field" required value={topic} onChange={(event) => setTopic(event.target.value)}><option value="">Chọn chủ đề</option><option>Daily Life</option><option>Food & Drinks</option><option>Travel Basics</option></select></div>
            <div className="admin-form-field"><label htmlFor="ai-type">Loại nội dung</label><select id="ai-type" className="admin-field" value={contentType} onChange={(event) => setContentType(event.target.value)}><option>Vocabulary</option><option>Questions</option><option>Lesson outline</option></select></div>
            <div className="admin-form-field"><label htmlFor="ai-count">Số lượng</label><input id="ai-count" className="admin-field" type="number" min={1} max={100} value={count} onChange={(event) => setCount(Number(event.target.value))} /></div>
            <div className="admin-form-field admin-form-field--wide"><label htmlFor="ai-requirements">Yêu cầu bổ sung</label><textarea id="ai-requirements" className="admin-textarea" rows={5} value={requirements} onChange={(event) => setRequirements(event.target.value)} placeholder="Ví dụ: phù hợp trình độ A1, dùng ngữ cảnh giao tiếp..." /></div>
            <div><button type="submit" className="admin-button admin-button--primary">Tạo nội dung</button></div>
          </form>
        </section>
      ) : (
        <DataTable headers={['Chủ đề', 'Loại', 'Yêu cầu', 'Đã tạo', 'Trạng thái', 'Ngày tạo']} caption="Lịch sử tạo nội dung AI">
          {mockAiHistory.map((item) => <tr key={item.id}><td className="admin-table__primary">{item.topic}</td><td>{item.type}</td><td>{item.requested}</td><td>{item.generated}</td><td><StatusBadge status={item.status} /></td><td>{item.createdAt}</td></tr>)}
        </DataTable>
      )}
    </div>
  )
}
