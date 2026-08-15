import { useMemo, useState } from 'react'
import DataTable from '../../components/admin/DataTable'
import MockNotice from '../../components/admin/MockNotice'
import PageHeader from '../../components/admin/PageHeader'
import SearchInput from '../../components/admin/SearchInput'
import StatusBadge from '../../components/admin/StatusBadge'
import { mockQuestions } from '../../mocks/admin.mock'

export default function AdminQuestionListPage() {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [status, setStatus] = useState('')
  const [notice, setNotice] = useState(false)
  const questions = useMemo(() => mockQuestions.filter((question) =>
    question.question.toLowerCase().includes(search.toLowerCase()) &&
    (!type || question.type === type) && (!difficulty || question.difficulty === difficulty) && (!status || question.status === status),
  ), [difficulty, search, status, type])

  return (
    <div className="admin-page">
      <PageHeader title="Ngân hàng câu hỏi" description="Quản lý các câu hỏi được sử dụng trong bài học." action={<button type="button" className="admin-button admin-button--primary" onClick={() => setNotice(true)}>+ Tạo câu hỏi</button>} />
      <MockNotice />
      {notice ? <div className="admin-notification admin-notification--success"><span>CRUD câu hỏi sẽ được kết nối khi backend sẵn sàng.</span><button type="button" onClick={() => setNotice(false)}>×</button></div> : null}
      <div className="admin-filter-bar">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm nội dung câu hỏi..." />
        <select className="admin-select" value={type} onChange={(event) => setType(event.target.value)} aria-label="Lọc loại câu hỏi"><option value="">Tất cả loại</option><option>Multiple Choice</option><option>Matching</option><option>Fill in blank</option></select>
        <select className="admin-select" value={difficulty} onChange={(event) => setDifficulty(event.target.value)} aria-label="Lọc độ khó"><option value="">Tất cả độ khó</option><option>Dễ</option><option>Trung bình</option><option>Khó</option></select>
        <select className="admin-select" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Lọc trạng thái"><option value="">Tất cả trạng thái</option><option value="PUBLISHED">Đã phát hành</option><option value="DRAFT">Bản nháp</option></select>
      </div>
      <DataTable headers={['Câu hỏi', 'Loại', 'Độ khó', 'Trạng thái', 'Thao tác']} caption="Danh sách câu hỏi">
        {questions.map((question) => <tr key={question.id}><td className="admin-table__primary">{question.question}</td><td>{question.type}</td><td>{question.difficulty}</td><td><StatusBadge status={question.status} /></td><td><button type="button" className="admin-button admin-button--secondary admin-button--small" disabled title="Chờ API">Chỉnh sửa</button></td></tr>)}
        {questions.length === 0 ? <tr><td colSpan={5}>Không tìm thấy câu hỏi phù hợp.</td></tr> : null}
      </DataTable>
    </div>
  )
}
