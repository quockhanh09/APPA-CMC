import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { roleTypes, staffStatusTypes } from '../data/staff'
import { updateStaff } from '../api'

export default function EditStaffModal({ member, currentUserId, onClose, onUpdated }) {
  const [form, setForm] = useState({
    name: member.name || '',
    username: member.username || '',
    email: member.email || '',
    phone: member.phone || '',
    role: member.role || 'manager',
    department: member.department || '',
    status: member.status || 'active',
    permissions: {
      view: member.permissions?.view ?? true,
      edit: member.permissions?.edit ?? false,
    },
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handlePermissionChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, permissions: { ...prev.permissions, [key]: e.target.checked } }))
  }

  const isSelf = member.id === currentUserId
  const currentPassword = member.temporaryPassword || ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = {
        name: form.name,
        username: form.username,
        email: form.email,
        phone: form.phone,
        role: form.role,
        department: form.department,
        status: form.status,
        permissions: form.permissions,
      }
      if (form.password) payload.password = form.password
      const { staff } = await updateStaff(member.id, payload)
      onUpdated(staff)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-card modal-card-lg" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal-header">
          <h2>Sửa nhân sự</h2>
          <button type="button" className="icon-btn" aria-label="Đóng" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="staff-edit-id">
          Mã nhân sự: <strong>{member.id}</strong>
        </div>

        <label className="login-field">
          <span>Họ và tên</span>
          <input type="text" value={form.name} onChange={handleChange('name')} required />
        </label>

        <label className="login-field">
          <span>Tài khoản</span>
          <input type="text" value={form.username} onChange={handleChange('username')} required />
        </label>

        <label className="login-field">
          <span>Email</span>
          <input type="email" value={form.email} onChange={handleChange('email')} required />
        </label>

        <label className="login-field">
          <span>Số điện thoại</span>
          <input type="text" value={form.phone} onChange={handleChange('phone')} required />
        </label>

        <label className="login-field">
          <span>Vai trò</span>
          <select value={form.role} onChange={handleChange('role')} required>
            {Object.entries(roleTypes).map(([key, role]) => (
              <option key={key} value={key}>
                {role.label}
              </option>
            ))}
          </select>
        </label>

        <label className="login-field">
          <span>Phòng ban</span>
          <input type="text" value={form.department} onChange={handleChange('department')} required />
        </label>

        <label className="login-field">
          <span>Trạng thái</span>
          <select
            value={form.status}
            onChange={handleChange('status')}
            disabled={isSelf && form.status === 'active'}
            required
          >
            {Object.entries(staffStatusTypes).map(([key, status]) => (
              <option key={key} value={key}>
                {status.label}
              </option>
            ))}
          </select>
        </label>

        <div className="login-field">
          <span>Mật khẩu hiện tại đã cấp</span>
          <div className="password-display">
            <input
              type={showPassword ? 'text' : 'password'}
              value={currentPassword}
              readOnly
              placeholder="Chưa có mật khẩu tạm được lưu — hãy đặt lại bên dưới"
            />
            <button
              type="button"
              className="icon-btn"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              onClick={() => setShowPassword((v) => !v)}
              disabled={!currentPassword}
            >
              {showPassword ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
            </button>
          </div>
        </div>

        <label className="login-field">
          <span>Mật khẩu mới (để trống nếu không đổi)</span>
          <input
            type="text"
            value={form.password}
            onChange={handleChange('password')}
            minLength={6}
            placeholder="Tối thiểu 6 ký tự"
          />
        </label>

        <div className="login-field">
          <span>Phân quyền</span>
          <div className="permission-checks">
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.permissions.view}
                onChange={handlePermissionChange('view')}
                disabled={isSelf}
              />
              Xem
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.permissions.edit}
                onChange={handlePermissionChange('edit')}
                disabled={isSelf}
              />
              Sửa
            </label>
          </div>
          {isSelf && (
            <span className="permission-self-note">
              Không thể tự thay đổi phân quyền và trạng thái của tài khoản đang đăng nhập
            </span>
          )}
        </div>

        {error && <p className="login-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  )
}
