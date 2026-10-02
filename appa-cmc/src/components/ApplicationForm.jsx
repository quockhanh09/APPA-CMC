import { useEffect, useRef, useState } from 'react'
import { calculateStatus } from '../utils/statusCalculator'
import { statusTypes } from '../data/statusTypes'
import {
  fetchApplicationState,
  reviewApplication,
  confirmApplicationPayment,
  uploadApplicationPaymentProof,
  acceptApplicationPayment,
} from '../api'

const SLA_HOURS = 72
const HISTORY_DOT_COLORS = ['#4caf50', '#3f51b5', '#ff9800', '#673ab7', '#2e7d32', '#e65100', '#d93838']

function formatVN(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${min}`
}

function formatCountdown(ms) {
  const clamped = Math.max(0, ms)
  const totalSeconds = Math.floor(clamped / 1000)
  const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const ss = String(totalSeconds % 60).padStart(2, '0')
  return `${hh} : ${mm} : ${ss}`
}

export default function ApplicationForm({ row, onClose, onSubmit, onStateChange }) {
  const [facility, setFacility] = useState(row.facility || 'Highlands Coffee Nhà Thờ')
  const [duration, setDuration] = useState(row.duration || '01/01/2026 – 31/12/2026')
  const [issueDate, setIssueDate] = useState(row.issueDate || '17/05/2026 10:15')
  const [paid, setPaid] = useState(row.paid ?? false)

  const [appState, setAppState] = useState(null)
  const [appError, setAppError] = useState('')
  const [reviewLoading, setReviewLoading] = useState(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [acceptLoading, setAcceptLoading] = useState(false)
  const [showCertificatePopup, setShowCertificatePopup] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const fileInputRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    fetchApplicationState(row.id)
      .then((data) => {
        if (!cancelled) setAppState(data.application)
      })
      .catch((err) => {
        if (!cancelled) setAppError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [row.id])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  // dong bo trang thai backend moi nhat ra ngoai (DataTable) moi khi thay doi
  useEffect(() => {
    if (appState) onStateChange?.(appState)
  }, [appState, onStateChange])

  const review = appState?.review || { status: 'pending', at: null }
  const payment = appState?.payment || { confirmed: false, confirmedAt: null, proof: null, verified: false, verifiedAt: null }
  const certificate = appState?.certificate || { issued: false, issuedAt: null }
  const createdAt = appState?.createdAt || null
  const history = appState?.history || []

  const deadlineMs = createdAt ? new Date(createdAt).getTime() + SLA_HOURS * 3600 * 1000 : null
  const countdownText = deadlineMs ? formatCountdown(deadlineMs - now) : '-- : -- : --'

  // trang thai hien thi dua theo hanh dong duyet/thanh toan va thoi han cap phep
  const status = calculateStatus({
    issueDate: payment.confirmedAt,
    paid: payment.confirmed,
    duration,
    reviewStatus: review.status,
  })
  const reviewPill = statusTypes[status.tone] || statusTypes.new

  const checkIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
  const clockIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
  const editIcon = <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
  const xIcon = <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>

  const step2Map = {
    pending: { color: '#673ab7', icon: clockIcon, label: 'Đang xử lý' },
    approved: { color: '#2e7d32', icon: checkIcon, label: 'Đã duyệt' },
    edit_requested: { color: '#e65100', icon: editIcon, label: 'Yêu cầu sửa' },
    rejected: { color: '#d93838', icon: xIcon, label: 'Đã từ chối' },
  }
  const step2 = step2Map[review.status] || step2Map.pending

  const step3 = payment.proof
    ? { filled: true, color: '#2e7d32', icon: checkIcon, label: `Đã nhận chứng từ · ${formatVN(payment.proof.uploadedAt)}` }
    : payment.confirmed
      ? { filled: true, color: '#673ab7', icon: clockIcon, label: `Chờ chứng từ · ${formatVN(payment.confirmedAt)}` }
      : { filled: false, icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>, label: 'Chờ xử lý' }

  const step4 = certificate.issued
    ? { filled: true, color: '#2e7d32', label: `Đã cấp chứng nhận · ${formatVN(certificate.issuedAt)}` }
    : payment.proof
      ? { filled: true, color: '#673ab7', label: 'Đang xử lý' }
      : { filled: false, label: 'Chờ xử lý' }

  const handleSubmit = async (e, actionType = 'save') => {
    e.preventDefault()
    const actionMap = { save: 'approve', request_edit: 'request_edit', reject: 'reject' }
    const reviewAction = actionMap[actionType]
    // duyệt đang chờ: cho phép cả 3 hành động; đã duyệt: chỉ còn được từ chối khi chưa có chứng từ thanh toán
    const canReview =
      review.status === 'pending' ||
      (review.status === 'approved' && actionType === 'reject' && !payment.proof)
    if (reviewAction && canReview) {
      setReviewLoading(reviewAction)
      try {
        await reviewApplication(row.id, reviewAction)
      } catch (err) {
        setAppError(err.message)
        setReviewLoading(null)
        return
      }
      setReviewLoading(null)
    }
    onSubmit({
      ...row,
      facility,
      duration,
      issueDate: issueDate || null,
      paid,
      action: actionType,
    })
  }

  const handleConfirmPayment = async () => {
    setPaymentLoading(true)
    try {
      const data = await confirmApplicationPayment(row.id)
      setAppState(data.application)
    } catch (err) {
      setAppError(err.message)
    } finally {
      setPaymentLoading(false)
    }
  }

  const handlePickProofFile = () => {
    if (!payment.confirmed || payment.proof) return
    fileInputRef.current?.click()
  }

  const handleProofFileChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploadLoading(true)
    try {
      const data = await uploadApplicationPaymentProof(row.id, file.name)
      setAppState(data.application)
    } catch (err) {
      setAppError(err.message)
    } finally {
      setUploadLoading(false)
    }
  }

  const handleAcceptPayment = async () => {
    if (!payment.proof) return
    setAcceptLoading(true)
    try {
      const data = await acceptApplicationPayment(row.id)
      setAppState(data.application)
    } catch (err) {
      setAppError(err.message)
    } finally {
      setAcceptLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card detail-modal-card" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '1300px', width: '100%', padding: '24px 32px', background: 'var(--panel)', color: 'var(--text-h)' }}
      >
        {/* Top Header Bar */}
        <div className="detail-top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '15px', fontWeight: '800', letterSpacing: '0.5px', color: 'var(--text-h)' }}>
                MÃ ĐƠN: #{row.id || 'APPA_CMC_0001'}
              </span>
              <span className="status-pill" style={{
                background: reviewPill.bg,
                border: `1px solid ${reviewPill.border}`,
                color: reviewPill.text,
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: reviewPill.dot }}></span>
                {status.label}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text)', marginTop: '4px' }}>
              Khởi tạo: {formatVN(createdAt) || row.createdTime || '—'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {review.status === 'pending' ? (
              <div style={{
                background: 'var(--red-bg, #fce8e6)',
                border: '1px solid var(--red-border, #f8d7da)',
                color: 'var(--red, #d93838)',
                padding: '8px 16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                fontWeight: '700'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <div>
                  <div style={{ fontSize: '10px', opacity: 0.85, textTransform: 'uppercase' }}>Thời gian xử lý hồ sơ còn lại</div>
                  <div style={{ fontSize: '13px', fontWeight: '800' }}>{countdownText}</div>
                </div>
              </div>
            ) : (
              <div style={{
                background: '#e8f5e9',
                border: '1px solid #c8e6c9',
                color: '#2e7d32',
                padding: '8px 16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                fontWeight: '700'
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                <div>
                  <div style={{ fontSize: '10px', opacity: 0.85, textTransform: 'uppercase' }}>Đã xử lý đăng ký</div>
                  <div style={{ fontSize: '13px', fontWeight: '800' }}>{formatVN(review.at)}</div>
                </div>
              </div>
            )}

            <button
              type="button"
              className="btn"
              onClick={handleConfirmPayment}
              disabled={payment.confirmed || paymentLoading}
              title="Nút tạm thời phục vụ việc test luồng xác nhận thanh toán"
              style={{
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: '700',
                borderRadius: '10px',
                background: payment.confirmed ? '#e8f5e9' : '#fff3e0',
                color: payment.confirmed ? '#2e7d32' : '#e65100',
                border: `1px solid ${payment.confirmed ? '#c8e6c9' : '#ffe0b2'}`,
                cursor: payment.confirmed ? 'default' : 'pointer',
                opacity: paymentLoading ? 0.6 : 1,
              }}
            >
              {payment.confirmed ? '✔ Đã thanh toán' : paymentLoading ? 'Đang xử lý...' : '(Test) Đã thanh toán'}
            </button>

            <button type="button" className="icon-btn table-icon-btn" aria-label="Đóng" onClick={onClose} style={{ borderRadius: '50%' }}>
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true">
                <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {appError && (
          <div style={{ background: '#fce8e6', border: '1px solid #f8d7da', color: '#d93838', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', fontWeight: '600', marginBottom: '16px' }}>
            {appError}
          </div>
        )}


        <form onSubmit={(e) => handleSubmit(e, 'save')} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 1. Tiến độ hồ sơ */}
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px' }}>
            <div style={{ textAlign: 'center', fontWeight: '700', fontSize: '13px', color: 'var(--text-h)', marginBottom: '16px', letterSpacing: '0.5px' }}>
              TIẾN ĐỘ HỒ SƠ
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', padding: '0 20px' }}>
              {/* Line connector */}
              <div style={{ position: 'absolute', top: '18px', left: '50px', right: '50px', height: '2px', background: 'var(--border)', zIndex: 1 }}></div>

              {/* Step 1 */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, gap: '6px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#2e7d32', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#2e7d32' }}>ĐĂNG KÝ SỬ DỤNG</span>
                <span style={{ fontSize: '10px', color: 'var(--text)' }}>{formatVN(createdAt) || '17/05/2026 10:15'}</span>
              </div>

              {/* Step 2 - Duyệt đăng ký */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, gap: '6px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: step2.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: review.status === 'pending' ? `0 0 0 4px ${step2.color}26` : 'none' }}>
                  {step2.icon}
                </div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: step2.color }}>DUYỆT ĐĂNG KÝ</span>
                <span style={{ fontSize: '10px', color: step2.color, fontStyle: review.status === 'pending' ? 'italic' : 'normal' }}>
                  {review.status === 'pending' ? 'Đang xử lý...' : `${step2.label} · ${formatVN(review.at)}`}
                </span>
              </div>

              {/* Step 3 - Thanh toán */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, gap: '6px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: step3.filled ? step3.color : 'var(--panel)', border: step3.filled ? 'none' : '2px solid var(--border)', color: step3.filled ? '#fff' : 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {step3.icon}
                </div>
                <span style={{ fontSize: '11px', fontWeight: step3.filled ? '700' : '600', color: step3.filled ? step3.color : 'var(--text)' }}>THANH TOÁN</span>
                <span style={{ fontSize: '10px', color: step3.filled ? step3.color : 'var(--text)' }}>{step3.label}</span>
              </div>

              {/* Step 4 - Cấp chứng nhận */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, gap: '6px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: step4.filled ? step4.color : 'var(--panel)', border: step4.filled ? 'none' : '2px solid var(--border)', color: step4.filled ? '#fff' : 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 15l-3.5 3.5a2.121 2.121 0 01-3-3L9 12M15 9l3.5-3.5a2.121 2.121 0 00-3-3L12 6"/></svg>
                </div>
                <span style={{ fontSize: '11px', fontWeight: step4.filled ? '700' : '600', color: step4.filled ? step4.color : 'var(--text)' }}>CẤP CHỨNG NHẬN</span>
                <span style={{ fontSize: '10px', color: step4.filled ? step4.color : 'var(--text)' }}>{step4.label}</span>
              </div>
            </div>
          </div>

          {/* Grid two columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Thông tin đơn vị sử dụng */}
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px', color: 'var(--text-h)', marginBottom: '14px' }}>
                  THÔNG TIN ĐƠN VỊ SỬ DỤNG
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', fontSize: '13px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text)', marginBottom: '2px' }}>TÊN ĐƠN VỊ SỬ DỤNG</div>
                    <div style={{ fontWeight: '700', color: 'var(--text-h)' }}>{row.unit || 'Viet Thai International JSC. Jollibee'}</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text)', marginBottom: '2px' }}>NGƯỜI ĐẠI DIỆN</div>
                      <div style={{ fontWeight: '600', color: 'var(--text-h)' }}>Nguyễn Văn B (Giám đốc)</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text)', marginBottom: '2px' }}>MÃ SỐ THUẾ</div>
                      <div style={{ fontWeight: '600', color: '#673ab7' }}>{row.taxCode || '0109876543'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text)', marginBottom: '2px' }}>SỐ ĐIỆN THOẠI</div>
                      <div style={{ fontWeight: '600', color: 'var(--text-h)' }}>0912.345.678</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text)', marginBottom: '2px' }}>EMAIL LIÊN HỆ</div>
                      <div style={{ fontWeight: '600', color: 'var(--text-h)' }}>contact@companyx.com</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '4px', background: 'var(--panel)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text)', fontWeight: '500' }}>Giấy đăng ký kinh doanh</span>
                    <button type="button" className="btn btn-outline" style={{ padding: '4px 12px', fontSize: '11px' }}>Xem</button>
                  </div>
                </div>
              </div>

              {/* Thông tin địa điểm & thông số tính phí */}
              <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px', color: 'var(--text-h)', marginBottom: '14px' }}>
                  THÔNG TIN ĐỊA ĐIỂM & THÔNG SỐ TÍNH PHÍ
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', fontSize: '13px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fff3e0', border: '1px solid #ffe0b2', color: '#e65100', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', width: 'fit-content' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                    Loại hình kinh doanh: Cà phê / F&B
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text)', marginBottom: '2px' }}>TÊN CƠ SỞ KINH DOANH</div>
                    <input 
                      type="text" 
                      value={facility} 
                      onChange={(e) => setFacility(e.target.value)} 
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text-h)', fontWeight: '600', fontSize: '13px' }}
                      required 
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text)', marginBottom: '2px' }}>ĐỊA CHỈ SỬ DỤNG</div>
                    <div style={{ fontWeight: '600', color: 'var(--text-h)' }}>123 Đường ABC, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text)', marginBottom: '2px' }}>DIỆN TÍCH (m²)</div>
                      <div style={{ fontWeight: '700', color: 'var(--text-h)' }}>150 m²</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text)', marginBottom: '2px' }}>THỜI HẠN TÍNH PHÍ</div>
                      <input 
                        type="text" 
                        value={duration} 
                        onChange={(e) => setDuration(e.target.value)} 
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--panel)', color: 'var(--text-h)', fontWeight: '600', fontSize: '13px' }}
                        required 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Cam kết và pháp lý */}
              <div style={{ background: '#312E81', color: '#fff', borderRadius: '16px', padding: '18px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px', marginBottom: '10px' }}>
                  CAM KẾT VÀ PHÁP LÝ
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', marginBottom: '6px' }}>
                  <span style={{ color: '#4caf50', display: 'inline-flex' }}>✔</span>
                  Đã tích chọn chấp thuận Điều khoản dịch vụ và Cam kết sử dụng v2
                </div>
                <div style={{ fontSize: '11px', opacity: 0.8, fontStyle: 'italic' }}>
                  Xác thực điện tử lúc 10:15:22 ngày 17/05/2026 qua IP: 113.161.xx.xxx
                </div>
              </div>

            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Chi tiết phí dự tính - Đã tăng kích thước rộng/cao phần chứng từ thanh toán */}
              <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '16px', padding: '22px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '800', letterSpacing: '0.5px', color: '#1a1a1a' }}>CHI TIẾT PHÍ DỰ TÍNH</span>
                  <span style={{ fontSize: '11px', color: '#5c6bc0', fontWeight: '700' }}>NĐ 17/2023/NĐ-CP</span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '13px' }}>
                  <span style={{ color: '#666', fontWeight: '500' }}>Phí cấp phép Quyền Liên quan:</span>
                  <span style={{ fontWeight: '800', color: '#1a1a1a', fontSize: '16px' }}>{row.fee || '3.500.000 VNĐ'}</span>
                </div>

                {/* Khung Chứng từ thanh toán mở rộng width & height */}
                <div style={{ background: '#f8f9fa', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', marginBottom: '16px', width: '100%', height: '600px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: '#444', marginBottom: '14px', letterSpacing: '0.3px' }}>CHỨNG TỪ THANH TOÁN</div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,image/*"
                    style={{ display: 'none' }}
                    onChange={handleProofFileChange}
                  />

                  {payment.proof ? (
                    /* Đã tải lên: hiển thị tên tệp */
                    <div style={{ border: '2px dashed #a7b4fe', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', background: '#f5f6ff', marginBottom: '16px', width: '100%', boxSizing: 'border-box', height: '470px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#e0e7ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', color: '#4E45E4' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 15 11 17 15 12"/></svg>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>{payment.proof.fileName}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Đã tải lên lúc {formatVN(payment.proof.uploadedAt)}</div>
                    </div>
                  ) : payment.confirmed ? (
                    /* Hiệu ứng cho phép tải lên sau khi khách xác nhận thanh toán */
                    <button
                      type="button"
                      onClick={handlePickProofFile}
                      disabled={uploadLoading}
                      style={{ border: '2px dashed #818cf8', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', background: '#eef2ff', marginBottom: '16px', width: '100%', boxSizing: 'border-box', height: '470px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#e0e7ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', color: '#4E45E4' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 13v8"/><path d="M8 17l4-4 4 4"/><path d="M20.4 18a4.5 4.5 0 00-1.7-8.7h-1.1A7 7 0 104 17.2"/></svg>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>{uploadLoading ? 'Đang tải lên...' : 'Nhấn để tải lên chứng từ thanh toán'}</div>
                      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>File pdf.</div>
                    </button>
                  ) : (
                    /* Chưa được phép: chờ khách xác nhận thanh toán */
                    <div style={{ border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', background: '#ffffff', marginBottom: '16px', width: '100%', boxSizing: 'border-box', height: '470px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#f3f4f6', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', color: '#9ca3af' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>CHƯA TẢI LÊN</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>Chờ khách hàng xác nhận đã thanh toán</div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <button type="button" disabled={!payment.proof} onClick={() => setShowCertificatePopup(true)} className="btn btn-outline" style={{ justifyContent: 'center', padding: '10px 8px', fontSize: '12px', gap: '6px', background: '#ffffff', fontWeight: '600', opacity: payment.proof ? 1 : 0.5, cursor: payment.proof ? 'pointer' : 'not-allowed' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                      Xem
                    </button>
                    <button type="button" disabled={!payment.proof} className="btn btn-outline" style={{ justifyContent: 'center', padding: '10px 8px', fontSize: '12px', gap: '6px', background: '#ffffff', fontWeight: '600', opacity: payment.proof ? 1 : 0.5, cursor: payment.proof ? 'pointer' : 'not-allowed' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 11-.57-8.38l5.65-5.65"/></svg>
                      Xoay
                    </button>
                    <button type="button" disabled={!payment.proof} className="btn btn-outline" style={{ justifyContent: 'center', padding: '10px 8px', fontSize: '12px', gap: '6px', background: '#ffffff', fontWeight: '600', opacity: payment.proof ? 1 : 0.5, cursor: payment.proof ? 'pointer' : 'not-allowed' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      Tải xuống
                    </button>
                  </div>
                </div>

                {/* Giấy chứng nhận cấp phép */}
                <div style={{ background: '#f8f9fa', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
                  <span style={{ fontSize: '12px', color: '#374151', fontWeight: '700' }}>GIẤY CHỨNG NHẬN CẤP PHÉP</span>
                  <span style={{ fontSize: '11px', color: '#9ca3af', fontStyle: 'italic' }}>(Chưa có sẵn)</span>
                </div>
              </div>

              {/* Lịch sử thao tác */}
              <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px', color: 'var(--text-h)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  LỊCH SỬ THAO TÁC
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', position: 'relative', paddingLeft: '16px' }}>
                  {/* Timeline vertical line */}
                  <div style={{ position: 'absolute', top: '6px', bottom: '6px', left: '4px', width: '2px', background: 'var(--border)' }}></div>

                  {history.length === 0 && (
                    <div style={{ fontSize: '12px', color: 'var(--text)' }}>Đang tải lịch sử...</div>
                  )}
                  {history.map((item, idx) => (
                    <div key={`${item.at}-${idx}`} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span style={{ position: 'absolute', left: '-16px', top: '4px', width: '8px', height: '8px', borderRadius: '50%', background: HISTORY_DOT_COLORS[idx % HISTORY_DOT_COLORS.length] }}></span>
                      <div style={{ fontSize: '10px', color: 'var(--text)' }}>{formatVN(item.at)}</div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-h)' }}>{item.text}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hành động */}
              <div style={{ background: '#ffffff', border: '1px solid var(--border)', borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px', color: '#6A6E71' }}>
                  HÀNH ĐỘNG
                </div>

                {review.status === 'edit_requested' || review.status === 'rejected' || payment.verified ? (
                  <div style={{ fontSize: '12px', fontWeight: '700', color: reviewPill.text, background: reviewPill.bg, border: `1px solid ${reviewPill.border}`, borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
                    Hồ sơ đã được xử lý: {status.label} lúc {formatVN(payment.verified ? payment.verifiedAt : review.at)}
                  </div>
                ) : review.status === 'approved' ? (
                  <>
                    <button
                      type="button"
                      onClick={handleAcceptPayment}
                      disabled={!payment.proof || acceptLoading}
                      title={!payment.proof ? 'Chỉ bấm được sau khi khách hàng tải chứng từ chuyển khoản thành công' : undefined}
                      className="btn"
                      style={{ width: '100%', justifyContent: 'center', background: payment.proof ? '#4E45E4' : '#d9d9e3', color: payment.proof ? '#fff' : '#8a8a94', padding: '12px', fontSize: '13px', fontWeight: '700', borderRadius: '12px', cursor: payment.proof ? 'pointer' : 'not-allowed', opacity: acceptLoading ? 0.6 : 1 }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      {acceptLoading ? 'Đang xử lý...' : 'Chấp nhận thanh toán'}
                    </button>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button
                        type="button"
                        disabled
                        title="Hồ sơ đã được duyệt, không thể yêu cầu sửa nữa"
                        className="btn"
                        style={{ justifyContent: 'center', background: '#f2f2f2', color: '#aaa', border: '1px solid #e0e0e0', padding: '10px', fontSize: '12px', fontWeight: '700', borderRadius: '12px', cursor: 'not-allowed' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Yêu cầu sửa
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleSubmit(e, 'reject')}
                        disabled={Boolean(reviewLoading) || Boolean(payment.proof)}
                        title={payment.proof ? 'Đã có chứng từ thanh toán, không thể từ chối hồ sơ nữa' : 'Từ chối nếu khách hàng mãi không thanh toán'}
                        className="btn"
                        style={{ justifyContent: 'center', background: payment.proof ? '#f2f2f2' : '#FFDBDA', color: payment.proof ? '#aaa' : '#f31a1a', border: `1px solid ${payment.proof ? '#e0e0e0' : '#f31a1a'}`, padding: '10px', fontSize: '12px', fontWeight: '700', borderRadius: '12px', cursor: payment.proof ? 'not-allowed' : 'pointer', opacity: reviewLoading ? 0.6 : 1 }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                        {reviewLoading === 'reject' ? 'Đang xử lý...' : 'Từ chối hồ sơ'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      type="submit"
                      className="btn"
                      disabled={Boolean(reviewLoading)}
                      style={{ width: '100%', justifyContent: 'center', background: '#4E45E4', color: '#fff', padding: '12px', fontSize: '13px', fontWeight: '700', borderRadius: '12px', opacity: reviewLoading ? 0.6 : 1 }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                      {reviewLoading === 'approve' ? 'Đang xử lý...' : 'Duyệt và gửi đề nghị thanh toán'}
                    </button>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={(e) => handleSubmit(e, 'request_edit')}
                        disabled={Boolean(reviewLoading)}
                        className="btn"
                        style={{ justifyContent: 'center', background: '#FFF1CC', color: '#7B3D1C', border: '1px solid #7B3D1C', padding: '10px', fontSize: '12px', fontWeight: '700', borderRadius: '12px', opacity: reviewLoading ? 0.6 : 1 }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        {reviewLoading === 'request_edit' ? 'Đang xử lý...' : 'Yêu cầu sửa'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleSubmit(e, 'reject')}
                        disabled={Boolean(reviewLoading)}
                        className="btn"
                        style={{ justifyContent: 'center', background: '#FFDBDA', color: '#f31a1a', border: '1px solid #f31a1a', padding: '10px', fontSize: '12px', fontWeight: '700', borderRadius: '12px', opacity: reviewLoading ? 0.6 : 1 }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                        {reviewLoading === 'reject' ? 'Đang xử lý...' : 'Từ chối hồ sơ'}
                      </button>
                    </div>
                  </>
                )}
              </div>

            </div>

          </div>
        </form>
      </div>

      {showCertificatePopup && (
        <div className="modal-overlay" onClick={() => setShowCertificatePopup(false)} style={{ zIndex: 200 }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-h)' }}>GIẤY CHỨNG NHẬN CẤP PHÉP</span>
              <button type="button" className="icon-btn table-icon-btn" aria-label="Đóng" onClick={() => setShowCertificatePopup(false)} style={{ borderRadius: '50%' }}>
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div style={{ border: '2px dashed #a7b4fe', borderRadius: '12px', padding: '32px 20px', textAlign: 'center', background: '#f5f6ff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#e0e7ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#4E45E4' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#374151' }}>
                {certificate.issued ? `Giấy chứng nhận #${row.id}` : 'Chứng từ đang chờ xác nhận'}
              </div>
              <div style={{ fontSize: '11px', color: '#6b7280' }}>
                {certificate.issued ? `Đã cấp lúc ${formatVN(certificate.issuedAt)}` : 'Giấy chứng nhận sẽ được cấp sau khi nhân viên chấp nhận thanh toán'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text)' }}>Đơn vị sử dụng</span>
                <span style={{ fontWeight: '700', color: 'var(--text-h)' }}>{row.unit || facility}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text)' }}>Cơ sở kinh doanh</span>
                <span style={{ fontWeight: '700', color: 'var(--text-h)' }}>{facility}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text)' }}>Thời hạn cấp phép</span>
                <span style={{ fontWeight: '700', color: 'var(--text-h)' }}>{duration}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text)' }}>Chứng từ thanh toán</span>
                <span style={{ fontWeight: '700', color: 'var(--text-h)' }}>{payment.proof?.fileName || '—'}</span>
              </div>
            </div>

            <button type="button" className="btn btn-outline" onClick={() => setShowCertificatePopup(false)} style={{ justifyContent: 'center' }}>
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  )
}