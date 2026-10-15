import { useRef, useState } from 'react'
import { createRegistration } from '../api'
import { businessTypes } from '../data/businessTypes'

// Ánh xạ mã loại hình CMS -> mã loại hình phía backend đăng ký công khai
const PUBLIC_TYPE_MAP = {
  coffee: 'cafe',
  restaurant: 'restaurant',
  store: 'shop',
  gym: 'spa',
  karaokeRoom: 'karaoke',
  karaokeBox: 'karaoke',
  bar: 'bar',
  hotel: 'hotel',
  entertainment: 'playground',
  mall: 'mall',
  supermarket: 'supermarket',
}

const TYPE_ABBR = {
  coffee: 'CF',
  restaurant: 'NH',
  store: 'CH',
  gym: 'SPA',
  karaokeRoom: 'KRP',
  karaokeBox: 'KRB',
  bar: 'BAR',
  hotel: 'KS',
  entertainment: 'KVC',
  mall: 'TTTM',
  supermarket: 'ST',
}

function getNextDailyOrderNumber() {
  const now = new Date()
  const dateKey = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const storageKey = `appa_daily_order_${dateKey}`
  let nextCount = 1
  try {
    nextCount = Number(window.localStorage.getItem(storageKey) || '0') + 1
    window.localStorage.setItem(storageKey, String(nextCount))
  } catch {}
  return String(nextCount).padStart(3, '0')
}

function generateCodeTail() {
  const random = Math.floor(100000 + Math.random() * 900000)
  return `${random}-${getNextDailyOrderNumber()}`
}

function buildRegistrationCode(typeKey, tail) {
  const abbr = TYPE_ABBR[typeKey] || 'KH'
  return `APPA-CMC-${abbr}-${tail}`
}

function formatFeeValue(digits) {
  if (!digits) return ''
  return new Intl.NumberFormat('vi-VN').format(Number(digits))
}

export default function NewApplicationForm({ onClose, onCreated }) {
  const [selectedType, setSelectedType] = useState('coffee')
  const [codeTail, setCodeTail] = useState(() => generateCodeTail())
  const registrationCode = buildRegistrationCode(selectedType, codeTail)

  const [unit, setUnit] = useState('')
  const [legalRepresentative, setLegalRepresentative] = useState('')
  const [taxCode, setTaxCode] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const [facility, setFacility] = useState('')
  const [storeAddress, setStoreAddress] = useState('')
  const [area, setArea] = useState('')
  const [duration, setDuration] = useState('')

  const [feeDigits, setFeeDigits] = useState('')

  const [licenseFileName, setLicenseFileName] = useState('')
  const [licenseFileMime, setLicenseFileMime] = useState('')

  const [isAgreed, setIsAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    background: 'var(--panel)',
    color: 'var(--text-h)',
    fontWeight: '600',
    fontSize: '13px',
    boxSizing: 'border-box',
  }
  const labelStyle = { fontSize: '11px', color: 'var(--text)', marginBottom: '4px', display: 'block' }
  const cardStyle = { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px' }
  const cardTitleStyle = { fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px', color: 'var(--text-h)', marginBottom: '14px' }
  const fieldColStyle = { display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }

  const buildPayload = (code) => {
    const isKaraoke = selectedType === 'karaokeRoom' || selectedType === 'karaokeBox'
    return {
      registrationCode: code,
      businessType: PUBLIC_TYPE_MAP[selectedType],
      karaokeSubType: isKaraoke ? (selectedType === 'karaokeBox' ? 'box' : 'room') : '',
      businessTypeLabel: businessTypes[selectedType]?.label || selectedType,
      companyName: unit.trim(),
      taxCode: taxCode.trim(),
      companyAddress: companyAddress.trim(),
      legalRepresentative: legalRepresentative.trim(),
      phone: phone.trim(),
      email: email.trim(),
      storeName: facility.trim(),
      storeAddress: storeAddress.trim(),
      paymentCycle: duration.trim(),
      scaleDetails: area.trim() ? `Diện tích: ${area.trim()} m2` : '',
      feeAmount: feeDigits ? Number(feeDigits) : undefined,
      fileName: licenseFileName,
      fileMimeType: licenseFileMime,
    }
  }

  const attemptCreate = async (code, attemptsLeft) => {
    try {
      const data = await createRegistration(buildPayload(code))
      return data.registration
    } catch (err) {
      const isDuplicate = err.message && err.message.includes('đã tồn tại')
      if (isDuplicate && attemptsLeft > 0) {
        const nextTail = generateCodeTail()
        setCodeTail(nextTail)
        return attemptCreate(buildRegistrationCode(selectedType, nextTail), attemptsLeft - 1)
      }
      throw err
    }
  }

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (submitting) return
    setError('')

    if (!unit.trim()) {
      setError('Vui lòng nhập tên đơn vị sử dụng')
      return
    }
    if (!facility.trim()) {
      setError('Vui lòng nhập tên cơ sở kinh doanh')
      return
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Email không hợp lệ')
      return
    }
    if (!feeDigits) {
      setError('Vui lòng nhập phí cấp phép quyền liên quan')
      return
    }
    if (!isAgreed) {
      setError('Vui lòng xác nhận cam kết và pháp lý trước khi tạo đơn')
      return
    }

    setSubmitting(true)
    try {
      const registration = await attemptCreate(registrationCode, 2)
      onCreated?.(registration)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handlePickLicenseFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setLicenseFileName(file.name)
    setLicenseFileMime(file.type || '')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card detail-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '1300px', width: '100%', padding: '24px 32px', background: 'var(--panel)', color: 'var(--text-h)' }}
      >
        <div className="detail-top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '0.5px', color: 'var(--text-h)' }}>
                TẠO ĐƠN MỚI
              </span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#673ab7' }}>
                MÃ ĐƠN: {registrationCode}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text)', marginTop: '4px' }}>
              Điền đầy đủ thông tin để tạo hồ sơ đăng ký mới
            </div>
          </div>

          <button type="button" className="icon-btn table-icon-btn" aria-label="Đóng" onClick={onClose} style={{ borderRadius: '50%' }}>
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {error && (
          <div style={{ background: '#fce8e6', border: '1px solid #f8d7da', color: '#d93838', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', fontWeight: '600', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              <div style={cardStyle}>
                <div style={cardTitleStyle}>THÔNG TIN ĐƠN VỊ SỬ DỤNG</div>
                <div style={fieldColStyle}>
                  <div>
                    <label style={labelStyle}>TÊN ĐƠN VỊ SỬ DỤNG *</label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="Nhập tên đơn vị / công ty"
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>NGƯỜI ĐẠI DIỆN</label>
                      <input
                        type="text"
                        value={legalRepresentative}
                        onChange={(e) => setLegalRepresentative(e.target.value)}
                        placeholder="Họ và tên"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>MÃ SỐ THUẾ</label>
                      <input
                        type="text"
                        value={taxCode}
                        onChange={(e) => setTaxCode(e.target.value)}
                        placeholder="Mã số thuế"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>ĐỊA CHỈ TRỤ SỞ</label>
                    <input
                      type="text"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>SỐ ĐIỆN THOẠI</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Số điện thoại"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>EMAIL LIÊN HỆ</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@example.com"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>GIẤY ĐĂNG KÝ KINH DOANH</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={handlePickLicenseFile}
                      style={{ display: 'none' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--panel)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text)', fontWeight: '500' }}>
                        {licenseFileName ? `Đã chọn: ${licenseFileName}` : 'Chưa đính kèm'}
                      </span>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ padding: '4px 12px', fontSize: '11px' }}
                      >
                        Chọn tệp
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div style={cardStyle}>
                <div style={cardTitleStyle}>THÔNG TIN ĐỊA ĐIỂM &amp; THÔNG SỐ TÍNH PHÍ</div>
                <div style={fieldColStyle}>
                  <div>
                    <label style={labelStyle}>LOẠI HÌNH KINH DOANH</label>
                    <select
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      {Object.entries(businessTypes).map(([key, type]) => (
                        <option key={key} value={key}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>TÊN CƠ SỞ KINH DOANH *</label>
                    <input
                      type="text"
                      value={facility}
                      onChange={(e) => setFacility(e.target.value)}
                      placeholder="Nhập tên cơ sở kinh doanh"
                      style={inputStyle}
                      required
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>ĐỊA CHỈ SỬ DỤNG</label>
                    <input
                      type="text"
                      value={storeAddress}
                      onChange={(e) => setStoreAddress(e.target.value)}
                      placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={labelStyle}>DIỆN TÍCH (m²)</label>
                      <input
                        type="number"
                        min="0"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        placeholder="0"
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>THỜI HẠN TÍNH PHÍ</label>
                      <input
                        type="text"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder="VD: 12 tháng"
                        style={inputStyle}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#312E81', color: '#fff', borderRadius: '16px', padding: '18px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px', marginBottom: '10px' }}>
                  CAM KẾT VÀ PHÁP LÝ
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', marginBottom: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                    style={{ width: '15px', height: '15px', accentColor: '#4caf50', cursor: 'pointer' }}
                  />
                  Đã tích chọn chấp thuận Điều khoản dịch vụ và Cam kết sử dụng v2
                </label>
                <div style={{ fontSize: '11px', opacity: 0.8, fontStyle: 'italic' }}>
                  Hồ sơ sẽ được tạo ở trạng thái chờ duyệt và xử lý thanh toán như quy trình thông thường
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '16px', padding: '22px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '800', letterSpacing: '0.5px', color: '#1a1a1a' }}>CHI TIẾT PHÍ DỰ TÍNH</span>
                  <span style={{ fontSize: '11px', color: '#5c6bc0', fontWeight: '700' }}>NĐ 17/2023/NĐ-CP &amp; NĐ 134/2026/NĐ-CP</span>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '13px', color: '#666', fontWeight: '500', display: 'block', marginBottom: '6px' }}>Phí cấp phép Quyền Liên quan: *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatFeeValue(feeDigits)}
                    onChange={(e) => setFeeDigits(e.target.value.replace(/\D/g, '').slice(0, 15))}
                    placeholder="VD: 765.072"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: '#f8f9fa', color: '#1a1a1a', fontWeight: '700', fontSize: '16px', boxSizing: 'border-box' }}
                    required
                  />
                  <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Đơn vị: VNĐ</div>
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px', color: '#6A6E71' }}>
                  HÀNH ĐỘNG
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="btn btn-outline"
                    style={{ justifyContent: 'center', background: '#ffffff', fontWeight: '700', padding: '12px', fontSize: '13px', borderRadius: '12px', opacity: submitting ? 0.6 : 1 }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn"
                    style={{ justifyContent: 'center', background: submitting ? '#a29bfe' : '#4E45E4', color: '#fff', padding: '12px', fontSize: '13px', fontWeight: '700', borderRadius: '12px', opacity: submitting ? 0.6 : 1 }}
                  >
                    {submitting ? 'Đang tạo...' : 'Tạo đơn'}
                  </button>
                </div>
              </div>

            </div>

          </div>
        </form>
      </div>
    </div>
  )
}
