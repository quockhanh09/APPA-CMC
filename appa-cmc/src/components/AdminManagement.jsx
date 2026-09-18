import { useEffect, useState } from 'react'
import { Pencil, Lock, Unlock, ShieldCheck } from 'lucide-react'
import { roleTypes, staffStatusTypes } from '../data/staff'
import { fetchStaff, toggleStaffLock } from '../api'
import AddStaffModal from './AddStaffModal'

const columns = ['STT', 'NHÂN SỰ', 'VAI TRÒ', 'PHÒNG BAN', 'SỐ ĐIỆN THOẠI', 'TRẠNG THÁI', 'NGÀY THAM GIA', 'PHÂN QUYỀN', 'HÀNH ĐỘNG']

function initials(name) {
  const parts = name.trim().split(' ')
  return parts[parts.length - 1]?.[0]?.toUpperCase() ?? '?'
}

function RoleBadge({ roleKey }) {
  const role = roleTypes[roleKey]
  return (
    <span className="type-badge" style={{ '--type-bg': role.bg, '--type-border': role.border }}>
      {role.label}
    </span>
  )
}

function StaffStatusPill({ statusKey }) {
  const status = staffStatusTypes[statusKey]
  return (
    <span
      className="status-pill"
      style={{ '--status-bg': status.bg, '--status-border': status.border, '--status-dot': status.dot, '--status-text': status.text }}
    >
      <span className="status-dot" />
      {status.label}
    </span>
  )
}

function PermissionBadges({ permissions }) {
  if (!permissions) return <span className="unit-tax">—</span>
  return (
    <div className="permission-badges">
      {permissions.view && <span className="permission-badge permission-view">Xem</span>}
      {permissions.edit && <span className="permission-badge permission-edit">Sửa</span>}
    </div>
  )
}

function StaffActions({ member, onToggleLock }) {
  if (member.isMainAdmin) {
    return (
      <span className="main-admin-tag">
        <ShieldCheck size={14} strokeWidth={2} />
        Tài khoản chính
      </span>
    )
  }
  return (
    <div className="staff-actions">
      <button type="button" className="icon-btn table-icon-btn" aria-label="Sửa nhân sự">
        <Pencil size={15} strokeWidth={2} />
      </button>
      <button
        type="button"
        className="icon-btn table-icon-btn"
        aria-label={member.status === 'locked' ? 'Mở khóa' : 'Khóa tài khoản'}
        onClick={() => onToggleLock(member.id)}
      >
        {member.status === 'locked' ? <Unlock size={15} strokeWidth={2} /> : <Lock size={15} strokeWidth={2} />}
      </button>
    </div>
  )
}

export default function AdminManagement() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const loadStaff = () => {
    setLoading(true)
    fetchStaff()
      .then(({ staff }) => setMembers(staff))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadStaff()
  }, [])

  const total = members.length
  const adminCount = members.filter((m) => m.role === 'admin').length
  const activeCount = members.filter((m) => m.status === 'active').length
  const lockedCount = members.filter((m) => m.status === 'locked').length

  const handleToggleLock = async (id) => {
    try {
      const { staff } = await toggleStaffLock(id)
      setMembers((prev) => prev.map((m) => (m.id === id ? staff : m)))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleStaffCreated = (staff) => {
    setMembers((prev) => [...prev, staff])
    setShowAddModal(false)
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>QUẢN TRỊ HỆ THỐNG</h1>
          <p>Quản lý tài khoản và phân quyền nhân sự sử dụng hệ thống</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          THÊM NHÂN SỰ
          <span aria-hidden="true">+</span>
        </button>
      </div>

      {error && <p className="login-error">{error}</p>}

      <section className="stats-overview admin-stats">
        <div className="stats-cards">
          <div className="stat-card" style={{ '--stat-color': 'var(--purple)' }}>
            <span className="stat-label">Tổng nhân sự</span>
            <span className="stat-value">{total}</span>
          </div>
          <div className="stat-card" style={{ '--stat-color': 'var(--purple)' }}>
            <span className="stat-label">Quản trị viên</span>
            <span className="stat-value">{adminCount}</span>
          </div>
          <div className="stat-card" style={{ '--stat-color': 'var(--green)' }}>
            <span className="stat-label">Đang hoạt động</span>
            <span className="stat-value">{activeCount}</span>
          </div>
          <div className="stat-card" style={{ '--stat-color': 'var(--red)' }}>
            <span className="stat-label">Tạm khóa</span>
            <span className="stat-value">{lockedCount}</span>
          </div>
        </div>
      </section>

      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length}>Đang tải dữ liệu...</td>
              </tr>
            ) : (
              members.map((member, index) => (
              <tr key={member.id}>
                <td>{index + 1}</td>
                <td>
                  <div className="unit-cell staff-cell">
                    <span className="staff-avatar">{initials(member.name)}</span>
                    <div className="staff-info">
                      <span className="unit-name">
                        {member.name}
                        {member.isMainAdmin && <span className="main-admin-dot" title="Quản trị viên chính" />}
                      </span>
                      <span className="unit-tax">{member.email}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <RoleBadge roleKey={member.role} />
                </td>
                <td>{member.department}</td>
                <td>{member.phone}</td>
                <td>
                  <StaffStatusPill statusKey={member.status} />
                </td>
                <td>{member.joinedAt}</td>
                <td>
                  <PermissionBadges permissions={member.permissions} />
                </td>
                <td>
                  <StaffActions member={member} onToggleLock={handleToggleLock} />
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="pagination">
        <span className="pagination-info">Hiển thị {total}/{total} kết quả</span>
      </footer>

      {showAddModal && (
        <AddStaffModal onClose={() => setShowAddModal(false)} onCreated={handleStaffCreated} />
      )}
    </>
  )
}

