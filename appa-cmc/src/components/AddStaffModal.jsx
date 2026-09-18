import { useState } from 'react'
import { roleTypes } from '../data/staff'
import { createStaff } from '../api'

const initialForm = {
  name: '',
  username: '',
  email: '',
  phone: '',
  role: 'manager',
  department: '',
  password: '',
  permissions: { view: true, edit: false },
}

export default function AddStaffModal({ onClose, onCreated }) {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handlePermissionChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, permissions: { ...prev.permissions, [key]: e.target.checked } }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { staff } = await createStaff(form)
      onCreated(staff)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal-header">
          <h2>Thêm nhân sự</h2>
          <button type="button" className="icon-btn" aria-label="Đóng" onClick={onClose}>
            ✕
          </button>
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
          <span>Mật khẩu tạm thời</span>
          <input type="text" value={form.password} onChange={handleChange('password')} required minLength={6} />
        </label>

        <div className="login-field">
          <span>Phân quyền</span>
          <div className="permission-checks">
            <label className="checkbox-field">
              <input type="checkbox" checked={form.permissions.view} onChange={handlePermissionChange('view')} />
              Xem
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={form.permissions.edit} onChange={handlePermissionChange('edit')} />
              Sửa
            </label>
          </div>
        </div>

        {error && <p className="login-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Hủy
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </div>
      </form>
    </div>
  )
}
