import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import ConfirmModal from '../../components/admin/ConfirmModal'
import DataTable from '../../components/admin/DataTable'
import DiamondPackageFormModal from '../../components/admin/DiamondPackageFormModal'
import EmptyState from '../../components/admin/EmptyState'
import ErrorState from '../../components/admin/ErrorState'
import LoadingState from '../../components/admin/LoadingState'
import PageHeader from '../../components/admin/PageHeader'
import StatusBadge from '../../components/admin/StatusBadge'
import type { DiamondPackageFormValues } from '../../schemas/diamond-package.schema'
import { adminDiamondPackageService } from '../../services/admin-diamond-package.service'
import type { DiamondPackage } from '../../types/diamond-package.types'

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫'
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export default function AdminDiamondPackagePage() {
  const queryClient = useQueryClient()
  const {
    data: packages = [],
    isLoading,
    error: queryError,
    refetch: refetchPackages,
  } = useQuery({
    queryKey: ['admin-diamond-packages'],
    queryFn: adminDiamondPackageService.getPackages,
  })

  const error = queryError
    ? queryError instanceof Error
      ? queryError.message
      : 'Không thể tải danh sách gói kim cương.'
    : null

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Form modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<DiamondPackage | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Delete modal
  const [packageToDelete, setPackageToDelete] = useState<DiamondPackage | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    window.setTimeout(() => setNotification(null), 4000)
  }

  const handleFormSubmit = async (values: DiamondPackageFormValues) => {
    setIsSubmitting(true)
    try {
      if (selectedPackage) {
        await adminDiamondPackageService.updatePackage(selectedPackage.id, values)
        showNotification('success', `Đã cập nhật gói “${values.name}”.`)
      } else {
        await adminDiamondPackageService.createPackage(values)
        showNotification('success', `Đã tạo gói kim cương mới “${values.name}”.`)
      }
      setIsFormModalOpen(false)
      setSelectedPackage(null)
      await queryClient.invalidateQueries({ queryKey: ['admin-diamond-packages'] })
    } catch (err: unknown) {
      showNotification('error', err instanceof Error ? err.message : 'Thao tác không thành công.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (pkg: DiamondPackage) => {
    const nextStatus = pkg.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      await adminDiamondPackageService.updatePackage(pkg.id, { status: nextStatus })
      showNotification('success', `Đã chuyển gói “${pkg.name}” sang ${nextStatus}.`)
      await queryClient.invalidateQueries({ queryKey: ['admin-diamond-packages'] })
    } catch (err: unknown) {
      showNotification('error', err instanceof Error ? err.message : 'Không thể đổi trạng thái gói.')
    }
  }

  const handleDelete = async () => {
    if (!packageToDelete) return
    setIsDeleting(true)
    try {
      await adminDiamondPackageService.deletePackage(packageToDelete.id)
      showNotification('success', `Đã xóa gói kim cương “${packageToDelete.name}”.`)
      setPackageToDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['admin-diamond-packages'] })
    } catch (err: unknown) {
      showNotification('error', err instanceof Error ? err.message : 'Không thể xóa gói kim cương.')
    } finally {
      setIsDeleting(false)
    }
  }

  const openCreateModal = () => {
    setSelectedPackage(null)
    setIsFormModalOpen(true)
  }

  return (
    <div className="admin-page">
      <PageHeader
        eyebrow="Thanh toán & Vật phẩm"
        title="Gói kim cương"
        description="Quản lý và thiết lập các gói nạp kim cương hiển thị cho người học tại Cửa hàng."
        action={
          <button
            type="button"
            className="admin-button admin-button--primary"
            onClick={openCreateModal}
          >
            + Thêm gói
          </button>
        }
      />

      {notification ? (
        <div
          className={`admin-notification admin-notification--${notification.type}`}
          role="status"
        >
          <span>{notification.message}</span>
          <button type="button" onClick={() => setNotification(null)}>
            ×
          </button>
        </div>
      ) : null}

      {isLoading ? <LoadingState label="Đang tải danh sách gói kim cương..." /> : null}

      {!isLoading && error ? (
        <ErrorState
          title="Không thể tải danh sách gói kim cương"
          message={error}
          onRetry={() => void refetchPackages()}
        />
      ) : null}

      {!isLoading && !error && packages.length === 0 ? (
        <EmptyState
          title="Chưa có gói kim cương nào"
          description="Tạo gói kim cương đầu tiên để bắt đầu thiết lập cửa hàng."
          action={
            <button
              type="button"
              className="admin-button admin-button--primary"
              onClick={openCreateModal}
            >
              + Thêm gói ngay
            </button>
          }
        />
      ) : null}

      {!isLoading && !error && packages.length > 0 ? (
        <DataTable
          headers={[
            'Tên gói',
            'Kim cương cơ bản',
            'Thưởng (Bonus)',
            'Tổng kim cương',
            'Giá tiền',
            'Thứ tự',
            'Trạng thái',
            'Ngày tạo',
            'Thao tác',
          ]}
          minWidth={980}
          caption="Danh sách gói kim cương"
        >
          {packages.map((pkg) => (
            <tr key={pkg.id}>
              <td>
                <strong className="admin-table__primary">{pkg.name}</strong>
                <span className="admin-table__secondary">Mã: {pkg.code}</span>
              </td>
              <td>{pkg.diamondAmount.toLocaleString('vi-VN')} 💎</td>
              <td>
                {pkg.bonusDiamond > 0 ? (
                  <span className="text-emerald-600 font-bold">
                    +{pkg.bonusDiamond.toLocaleString('vi-VN')} 💎
                  </span>
                ) : (
                  <span className="text-slate-400">0</span>
                )}
              </td>
              <td>
                <strong style={{ color: '#0284c7' }}>
                  {pkg.totalDiamond.toLocaleString('vi-VN')} 💎
                </strong>
              </td>
              <td>
                <strong>{formatVnd(pkg.price)}</strong>
              </td>
              <td>#{pkg.orderIndex}</td>
              <td>
                <StatusBadge status={pkg.status} />
              </td>
              <td>{formatDate(pkg.createdAt)}</td>
              <td>
                <span className="admin-actions">
                  <button
                    type="button"
                    className="admin-button admin-button--secondary admin-button--small"
                    onClick={() => {
                      setSelectedPackage(pkg)
                      setIsFormModalOpen(true)
                    }}
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    className="admin-button admin-button--secondary admin-button--small"
                    onClick={() => void handleToggleStatus(pkg)}
                  >
                    {pkg.status === 'ACTIVE' ? 'Ẩn gói' : 'Kích hoạt'}
                  </button>
                  <button
                    type="button"
                    className="admin-button admin-button--danger admin-button--small"
                    onClick={() => setPackageToDelete(pkg)}
                  >
                    Xóa
                  </button>
                </span>
              </td>
            </tr>
          ))}
        </DataTable>
      ) : null}

      <DiamondPackageFormModal
        isOpen={isFormModalOpen}
        packageData={selectedPackage}
        isLoading={isSubmitting}
        onSubmit={handleFormSubmit}
        onClose={() => {
          setIsFormModalOpen(false)
          setSelectedPackage(null)
        }}
      />

      <ConfirmModal
        isOpen={Boolean(packageToDelete)}
        title="Xóa gói kim cương"
        message={`Bạn có chắc chắn muốn xóa gói kim cương “${packageToDelete?.name ?? ''}”? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xác nhận xóa"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={() => void handleDelete()}
        onClose={() => setPackageToDelete(null)}
      />
    </div>
  )
}
