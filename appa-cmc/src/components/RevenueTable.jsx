import { businessTypes } from '../data/businessTypes'
import { paymentStatusTypes } from '../data/paymentStatusTypes'
import { formatVNDShort } from '../data/revenue'

const columns = [
  'STT',
  'MÃ ĐƠN',
  'ĐƠN VỊ SỬ DỤNG / MST\nCƠ SỞ KINH DOANH',
  'LOẠI HÌNH KINH DOANH',
  'DOANH THU ĐÃ NHẬN',
  'DOANH THU CHỜ NHẬN',
  'KỲ THỜI HẠN',
  'TRẠNG THÁI THANH TOÁN',
  'HÀNH ĐỘNG',
]

function TypeBadge({ typeKey }) {
  const type = businessTypes[typeKey]
  if (!type) return null
  const Icon = type.icon
  return (
    <span className="type-badge" style={{ '--type-bg': type.bg, '--type-border': type.border }}>
      <Icon className="type-icon" size={14} strokeWidth={2} />
      {type.label}
    </span>
  )
}

function PaymentStatusPill({ status }) {
  const tone = paymentStatusTypes[status.tone] || paymentStatusTypes.awaiting
  return (
    <div className="payment-status-cell">
      <span
        className="status-pill"
        style={{ '--status-bg': tone.bg, '--status-border': tone.border, '--status-dot': tone.dot, '--status-text': tone.text }}
      >
        <span className="status-dot" />
        {status.label}
      </span>
      {status.sub && <span className="payment-status-sub">({status.sub})</span>}
    </div>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true">
      <path
        d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

export default function RevenueTable({ rows = [], currentPage, pageSize }) {
  const startIndex = (currentPage - 1) * pageSize
  const pageRows = rows.slice(startIndex, startIndex + pageSize)

  return (
    <div className="table-wrapper">
      <table className="data-table revenue-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} style={{ whiteSpace: 'pre-line' }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageRows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '32px' }}>
                Không tìm thấy dữ liệu doanh thu phù hợp.
              </td>
            </tr>
          ) : (
            pageRows.map((row, rowIndex) => (
              <tr key={row.id}>
                <td>{startIndex + rowIndex + 1}</td>
                <td className="cell-strong">{row.id}</td>
                <td>
                  <div className="unit-cell">
                    <span className="unit-name">
                      {row.unit} - {row.taxCode}
                    </span>
                    <span className="unit-tax">→ {row.facility}</span>
                  </div>
                </td>
                <td>
                  <TypeBadge typeKey={row.type} />
                </td>
                <td>{formatVNDShort(row.recognizedAmount)}</td>
                <td className="cell-strong">{formatVNDShort(row.pendingAmount)}</td>
                <td>{row.periodLabel}</td>
                <td>
                  <PaymentStatusPill status={row.status} />
                </td>
                <td>
                  <button type="button" className="icon-btn table-icon-btn" aria-label="Xem chi tiết">
                    <EyeIcon />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
