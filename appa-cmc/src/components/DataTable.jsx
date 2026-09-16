import { useState } from 'react'
import { applications } from '../data/applications'
import { businessTypes } from '../data/businessTypes'
import { statusTypes } from '../data/statusTypes'

const statusOptions = [
  { tone: 'new', label: 'Mới đăng ký' },
  { tone: 'pending', label: 'Chờ thanh toán' },
  { tone: 'licensed', label: 'Đã cấp phép' },
  { tone: 'expiring', label: 'Sắp hết hạn' },
  { tone: 'expired', label: 'Quá hạn' },
]

const columns = [
  'STT',
  'MÃ ĐƠN',
  'ĐƠN VỊ SỬ DỤNG / MST',
  'CƠ SỞ KINH DOANH',
  'LOẠI HÌNH KINH DOANH',
  'PHÍ SỬ DỤNG',
  'TRẠNG THÁI',
  'THỜI HẠN CẤP PHÉP',
  'HÀNH ĐỘNG',
]

function TypeBadge({ typeKey }) {
  const type = businessTypes[typeKey]
  const Icon = type.icon
  return (
    <span className="type-badge" style={{ '--type-bg': type.bg, '--type-border': type.border }}>
      <Icon className="type-icon" size={14} strokeWidth={2} />
      {type.label}
    </span>
  )
}

function StatusPill({ status, onChange }) {
  if (status.tone === 'select') {
    return (
      <label className="status-select">
        <select
          defaultValue=""
          onChange={(event) => {
            const option = statusOptions.find((opt) => opt.tone === event.target.value)
            if (option) onChange?.(option)
          }}
        >
          <option value="" disabled>
            {status.label}
          </option>
          {statusOptions.map((option) => (
            <option key={option.tone} value={option.tone}>
              {option.label}
            </option>
          ))}
        </select>
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </label>
    )
  }
  const tone = statusTypes[status.tone]
  return (
    <span
      className="status-pill"
      style={{ '--status-bg': tone.bg, '--status-border': tone.border, '--status-dot': tone.dot, '--status-text': tone.text }}
    >
      <span className="status-dot" />
      {status.label}
    </span>
  )
}

function ActionCell({ action }) {
  if (action.kind === 'button') {
    return (
      <button type="button" className={`action-btn action-${action.tone}`}>
        {action.label}
      </button>
    )
  }
  if (action.kind === 'eye') {
    return (
      <button type="button" className="icon-btn table-icon-btn" aria-label="Xem chi tiết">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true">
          <path
            d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>
    )
  }
  return (
    <button type="button" className="icon-btn table-icon-btn" aria-label="Thông tin">
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
        <path d="M12 11v5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="12" cy="7.8" r="1" fill="currentColor" />
      </svg>
    </button>
  )
}

export default function DataTable({ currentPage, pageSize }) {
  const [statuses, setStatuses] = useState(() => applications.map((row) => row.status))

  const handleStatusChange = (index, option) => {
    setStatuses((prev) => prev.map((status, i) => (i === index ? { label: option.label, tone: option.tone } : status)))
  }

  const startIndex = (currentPage - 1) * pageSize
  const pageRows = applications.slice(startIndex, startIndex + pageSize)

  return (
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
          {pageRows.map((row, rowIndex) => {
            const index = startIndex + rowIndex
            return (
              <tr key={row.id}>
                <td>{index + 1}</td>
                <td className="cell-strong">{row.id}</td>
                <td>
                  <div className="unit-cell">
                    <span className="unit-name">{row.unit}</span>
                    <span className="unit-tax">{row.taxCode}</span>
                  </div>
                </td>
                <td>{row.facility}</td>
                <td>
                  <TypeBadge typeKey={row.type} />
                </td>
                <td>{row.fee}</td>
                <td>
                  <StatusPill status={statuses[index]} onChange={(option) => handleStatusChange(index, option)} />
                </td>
                <td>{row.duration}</td>
                <td>
                  <ActionCell action={row.action} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
