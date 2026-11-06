import { useMemo, useState } from 'react'
import { createUnit, updateUnit } from '../api'
import { businessTypes } from '../data/businessTypes'
import { cities, wards } from '../data/vietnamLocations'

const CATEGORY_OPTIONS = [
  ...Object.entries(businessTypes).map(([value, type]) => ({ value, label: type.label })),
  { value: 'other', label: 'Khác' },
]

// đổi dd/mm/yyyy (định dạng hiển thị/backend) <-> yyyy-mm-dd (input type="date")
function displayToInputDate(value) {
  if (!value) return ''
  const [d, m, y] = String(value).split('/')
  if (!d || !m || !y) return ''
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

function inputToDisplayDate(value) {
  if (!value) return ''
  const [y, m, d] = String(value).split('-')
  if (!y || !m || !d) return ''
  return `${d}/${m}/${y}`
}

const initialForm = {
  companyName: '',
  taxCode: '',
  facilityName: '',
  category: 'coffee',
  city: '',
  ward: '',
  address: '',
  areaM2: '',
  licenseStart: '',
  licenseEnd: '',
  status: 'pending',
}

export default function UnitFormModal({ unit, onClose, onSaved }) {
  const isEdit = Boolean(unit)
  const [form, setForm] = useState(() =>
    unit
      ? {
          companyName: unit.companyName || '',
          taxCode: unit.taxCode || '',
          facilityName: unit.facilityName || '',
          category: unit.category || 'coffee',
          city: unit.city || '',
          ward: unit.ward || '',
          address: unit.address || '',
          areaM2: unit.areaM2 ?? '',
          licenseStart: displayToInputDate(unit.licenseStart),
          licenseEnd: displayToInputDate(unit.licenseEnd),
          status: unit.status || 'pending',
        }
      : initialForm,
  )
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const wardSuggestions = useMemo(() => {
    const city = cities.find((c) => c.name === form.city)
    if (!city) return []
    return wards.filter((w) => w.cityId === city.id)
  }, [form.city])

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.licenseStart && form.licenseEnd && form.licenseStart > form.licenseEnd) {
      setError('Ngày hết hạn cấp phép phải sau ngày bắt đầu')
      return
    }

    setLoading(true)
    const payload = {
      companyName: form.companyName,
      taxCode: form.taxCode,
      facilityName: form.facilityName,
      category: form.category,
      city: form.city,
      ward: form.ward,
      address: form.address,
      areaM2: form.areaM2 === '' ? null : Number(form.areaM2),
      licenseStart: inputToDisplayDate(form.licenseStart),
      licenseEnd: inputToDisplayDate(form.licenseEnd),
      status: form.status,
    }
    try {
      if (isEdit) {
        await updateUnit(unit.id, payload)
      } else {
        await createUnit(payload)
      }
      onSaved()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form
        className="modal-card modal-card-lg"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="modal-header">
          <h2>{isEdit ? `Chỉnh sửa đơn vị ${unit.id}` : 'Thêm đơn vị sử dụng'}</h2>
          <button type="button" className="icon-btn" aria-label="Đóng" onClick={onClose}>
            ✕
          </button>
        </div>

        <label className="login-field">
          <span>Công ty / Doanh nghiệp *</span>
          <input type="text" value={form.companyName} onChange={handleChange('companyName')} required />
        </label>

        <div className="unit-form-grid">
          <label className="login-field">
            <span>Mã số thuế</span>
            <input type="text" value={form.taxCode} onChange={handleChange('taxCode')} />
          </label>

          <label className="login-field">
            <span>Loại hình kinh doanh</span>
            <select value={form.category} onChange={handleChange('category')}>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="login-field">
          <span>Cơ sở kinh doanh</span>
          <input type="text" value={form.facilityName} onChange={handleChange('facilityName')} />
        </label>

        <div className="unit-form-grid">
          <label className="login-field">
            <span>TP / Tỉnh</span>
            <input
              type="text"
              list="unit-city-options"
              value={form.city}
              onChange={handleChange('city')}
            />
            <datalist id="unit-city-options">
              {cities.map((city) => (
                <option key={city.id} value={city.name} />
              ))}
            </datalist>
          </label>

          <label className="login-field">
            <span>Phường / Xã</span>
            <input
              type="text"
              list="unit-ward-options"
              value={form.ward}
              onChange={handleChange('ward')}
            />
            <datalist id="unit-ward-options">
              {wardSuggestions.map((ward) => (
                <option key={ward.id} value={ward.name} />
              ))}
            </datalist>
          </label>
        </div>

        <label className="login-field">
          <span>Địa chỉ</span>
          <input type="text" value={form.address} onChange={handleChange('address')} />
        </label>

        <div className="unit-form-grid">
          <label className="login-field">
            <span>Cấp phép từ ngày</span>
            <input type="date" value={form.licenseStart} onChange={handleChange('licenseStart')} />
          </label>

          <label className="login-field">
            <span>Cấp phép đến ngày</span>
            <input type="date" value={form.licenseEnd} onChange={handleChange('licenseEnd')} />
          </label>
        </div>

        <div className="unit-form-grid">
          <label className="login-field">
            <span>Diện tích (m²)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.areaM2}
              onChange={handleChange('areaM2')}
            />
          </label>

          <label className="login-field">
            <span>Trạng thái</span>
            <select value={form.status} onChange={handleChange('status')}>
              <option value="pending">Chưa duyệt</option>
              <option value="approved">Đã duyệt</option>
            </select>
          </label>
        </div>

        {error && <p className="login-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
            Hủy
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm đơn vị'}
          </button>
        </div>
      </form>
    </div>
  )
}
