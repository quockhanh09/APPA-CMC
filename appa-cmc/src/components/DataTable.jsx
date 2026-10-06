import { useState } from 'react'
import { businessTypes } from '../data/businessTypes'
import { statusTypes } from '../data/statusTypes'
import { calculateStatus } from '../utils/statusCalculator'
import ApplicationForm from './ApplicationForm'

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

function StatusPill({ status }) {
  const tone = statusTypes[status.tone] || statusTypes.licensed
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

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 11v5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="7.8" r="1" fill="currentColor" />
    </svg>
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

function ActionCell({ viewed, onClick }) {
  const Icon = viewed ? EyeIcon : InfoIcon
  const label = viewed ? 'Xem chi tiết' : 'Thông tin'
  return (
    <button type="button" className="icon-btn table-icon-btn" aria-label={label} onClick={onClick}>
      <Icon />
    </button>
  )
}

export default function DataTable({ applications = [], currentPage, pageSize }) {
  const [viewedRows, setViewedRows] = useState(new Set())
  const [rowEdits, setRowEdits] = useState({})
  const [formRow, setFormRow] = useState(null)
  const [appStates, setAppStates] = useState({})

  const startIndex = (currentPage - 1) * pageSize
  const pageRows = applications.slice(startIndex, startIndex + pageSize)

  const handleOpenForm = (row) => {
    const edits = rowEdits[row.id]
    setFormRow(edits ? { ...row, ...edits } : row)
  }

  const handleFormSubmit = (updatedRow) => {
    setViewedRows((prev) => new Set(prev).add(updatedRow.id))
    setRowEdits((prev) => ({ ...prev, [updatedRow.id]: updatedRow }))
    setFormRow(null)
  }

  const handleCloseForm = () => {
    setFormRow(null)
  }

  const handleAppStateChange = (id, state) => {
    setAppStates((prev) => ({ ...prev, [id]: state }))
  }

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
          {pageRows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '32px' }}>
                Chưa có hồ sơ đăng ký nào.
              </td>
            </tr>
          ) : pageRows.map((row, rowIndex) => {
            const index = startIndex + rowIndex
            // trạng thái dựa theo hành động duyệt hồ sơ (nếu đã mở) và thời hạn cấp phép
            const appState = appStates[row.id] || row.workflow
            const status = calculateStatus({
              issueDate: appState ? appState.payment.confirmedAt : row.issueDate,
              paid: appState ? appState.payment.confirmed : row.paid,
              duration: row.duration,
              reviewStatus: appState?.review.status,
              forcedTone: appState?.review.forcedTone,
            })
            const viewed = viewedRows.has(row.id)
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
                  <StatusPill status={status} />
                </td>
                <td>{row.duration}</td>
                <td>
                  <ActionCell viewed={viewed} onClick={() => handleOpenForm(row)} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {formRow && (
        <ApplicationForm
          row={formRow}
          onClose={handleCloseForm}
          onSubmit={handleFormSubmit}
          onStateChange={(state) => handleAppStateChange(formRow.id, state)}
        />
      )}
    </div>
  )
}
