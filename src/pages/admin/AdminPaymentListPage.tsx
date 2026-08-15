import { useMemo, useState } from 'react'
import DataTable from '../../components/admin/DataTable'
import MockNotice from '../../components/admin/MockNotice'
import PageHeader from '../../components/admin/PageHeader'
import StatusBadge from '../../components/admin/StatusBadge'
import { mockPayments } from '../../mocks/admin.mock'

export default function AdminPaymentListPage() {
  const [status, setStatus] = useState('')
  const [method, setMethod] = useState('')
  const [date, setDate] = useState('')
  const payments = useMemo(() => mockPayments.filter((item) =>
    (!status || item.status === status) && (!method || item.method === method) && (!date || item.createdAt.includes(date.split('-').reverse().join('/'))),
  ), [date, method, status])

  return (
    <div className="admin-page">
      <PageHeader title="Giao dịch" description="Theo dõi các giao dịch mua kim cương trong hệ thống." />
      <MockNotice />
      <div className="admin-filter-bar">
        <select className="admin-select" value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Lọc trạng thái"><option value="">Tất cả trạng thái</option><option value="SUCCESS">Thành công</option><option value="PENDING">Đang chờ</option><option value="FAILED">Thất bại</option><option value="CANCELLED">Đã hủy</option></select>
        <select className="admin-select" value={method} onChange={(event) => setMethod(event.target.value)} aria-label="Lọc phương thức"><option value="">Mọi phương thức</option><option>MOMO</option><option>VNPAY</option><option>BANKING</option></select>
        <input className="admin-field" style={{ width: 170 }} type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Lọc ngày" />
      </div>
      <DataTable headers={['Mã giao dịch','Người dùng','Gói','Số tiền','Phương thức','Trạng thái','Ngày tạo']} minWidth={900} caption="Danh sách giao dịch">
        {payments.map((item) => <tr key={item.id}><td className="admin-table__primary">{item.id}</td><td>{item.user}</td><td>{item.package}</td><td>{item.amount.toLocaleString('vi-VN')} ₫</td><td>{item.method}</td><td><StatusBadge status={item.status} /></td><td>{item.createdAt}</td></tr>)}
        {payments.length === 0 ? <tr><td colSpan={7}>Không có giao dịch phù hợp bộ lọc.</td></tr> : null}
      </DataTable>
    </div>
  )
}
