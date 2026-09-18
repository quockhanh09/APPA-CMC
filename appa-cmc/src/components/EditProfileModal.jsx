import { useState } from 'react'
import { updateProfile, setSession, getToken } from '../api'

export default function EditProfileModal({ user, onClose, onUpdated }) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [phone, setPhone] = useState(user.phone)
  const [department, setDepartment] = useState(user.department)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { user: updatedUser } = await updateProfile({ name, email, phone, department })
      setSession(getToken(), updatedUser)
      onUpdated(updatedUser)
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
          <h2>Sửa thông tin</h2>
          <button type="button" className="icon-btn" aria-label="Đóng" onClick={onClose}>
            ✕
          </button>
        </div>

        <label className="login-field">
          <span>Họ và tên</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>

        <label className="login-field">
          <span>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>

        <label className="login-field">
          <span>Số điện thoại</span>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </label>

        <label className="login-field">
          <span>Phòng ban</span>
          <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} required />
        </label>

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
