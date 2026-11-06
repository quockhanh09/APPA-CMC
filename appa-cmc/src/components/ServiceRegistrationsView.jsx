import { useCallback, useEffect, useMemo, useState } from 'react'
import Pagination from './Pagination'
import ServiceRegistrationsStats, { SERVICE_STATUS_LABELS } from './ServiceRegistrationsStats'
import { statusTypes } from '../data/statusTypes'

const PAGE_SIZE = 10

const STATUS_OPTIONS = [
  { value: 'new', label: SERVICE_STATUS_LABELS.new },
  { value: 'processing', label: SERVICE_STATUS_LABELS.processing },
  { value: 'licensed', label: SERVICE_STATUS_LABELS.licensed },
  { value: 'rejected', label: SERVICE_STATUS_LABELS.rejected },
]

// dùng lại bộ màu pill của trang Tổng quan; 'processing' dùng màu của 'pending'
const STATUS_TONES = {
  new: statusTypes.new,
  processing: statusTypes.pending,
  licensed: statusTypes.licensed,
  rejected: statusTypes.rejected,
}

function StatusPill({ status }) {
  const tone = STATUS_TONES[status] || STATUS_TONES.new
  return (
    <span
      className="status-pill"
      style={{ '--status-bg': tone.bg, '--status-border': tone.border, '--status-dot': tone.dot, '--status-text': tone.text }}
    >
      <span className="status-dot" />
      {SERVICE_STATUS_LABELS[status] || status}
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

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatFee(value) {
  if (!Number.isFinite(value) || value <= 0) return '—'
  return `${new Intl.NumberFormat('vi-VN').format(value)} VNĐ`
}

function DetailModal({ row, sections, list, canEdit, onClose, onUpdateStatus }) {
  const [status, setStatus] = useState(row.status || 'new')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (saving || status === row.status) return
    setSaving(true)
    setError('')
    try {
      await onUpdateStatus(row.id, status)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card service-detail-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <h2>CHI TIẾT ĐƠN ĐĂNG KÝ</h2>
          <StatusPill status={row.status} />
        </div>
        <p className="service-detail-id">MÃ ĐƠN: {row.id}</p>

        {sections.map((section) => (
          <section key={section.title} className="service-detail-section">
            <h3>{section.title}</h3>
            <dl className="service-detail-grid">
              {section.fields
                .filter((field) => field.value !== undefined && field.value !== null && field.value !== '')
                .map((field) => (
                  <div key={field.label} className="service-detail-field">
                    <dt>{field.label}</dt>
                    <dd>{field.value}</dd>
                  </div>
                ))}
            </dl>
          </section>
        ))}

        {list && list.rows.length > 0 && (
          <section className="service-detail-section">
            <h3>{list.title}</h3>
            <div className="table-wrapper service-detail-table">
              <table className="data-table">
                <thead>
                  <tr>
                    {list.columns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {list.rows.map((cells, index) => (
                    <tr key={index}>
                      {cells.map((cell, cellIndex) => (
                        <td key={cellIndex}>{cell || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {canEdit && (
          <section className="service-detail-section">
            <h3>CẬP NHẬT TRẠNG THÁI</h3>
            <div className="service-status-editor">
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-primary"
                disabled={saving || status === row.status}
                onClick={handleSave}
              >
                {saving ? 'Đang lưu...' : 'Lưu trạng thái'}
              </button>
            </div>
            {error && <p className="login-error" role="alert">{error}</p>}
          </section>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ServiceRegistrationsView({
  title,
  subtitle,
  fetchRegistrations,
  updateRegistrationStatus,
  columns,
  typeOptions = [],
  typeFilterKey,
  getSearchText,
  buildDetailSections,
  buildDetailList,
  canEdit = false,
}) {
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRow, setSelectedRow] = useState(null)

  const loadRegistrations = useCallback(async () => {
    try {
      const data = await fetchRegistrations()
      setRegistrations(data.registrations || [])
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [fetchRegistrations])

  useEffect(() => {
    loadRegistrations()
    const interval = setInterval(loadRegistrations, 15000)
    return () => clearInterval(interval)
  }, [loadRegistrations])

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return registrations.filter((row) => {
      const matchesSearch = !term || (getSearchText?.(row) || '').toLowerCase().includes(term)
      const matchesType = typeFilter === 'all' || (typeFilterKey && row[typeFilterKey] === typeFilter)
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter
      return matchesSearch && matchesType && matchesStatus
    })
  }, [registrations, searchTerm, typeFilter, statusFilter, typeFilterKey, getSearchText])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const pageRows = filteredRows.slice(startIndex, startIndex + PAGE_SIZE)

  const updateFilter = (setter) => (value) => {
    setter(value)
    setCurrentPage(1)
  }

  const handleUpdateStatus = async (id, status) => {
    await updateRegistrationStatus(id, status)
    await loadRegistrations()
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <ServiceRegistrationsStats registrations={registrations} />
      {error && <p className="login-error" role="alert">Không thể tải dữ liệu: {error}</p>}
      {loading ? (
        <p role="status">Đang tải dữ liệu...</p>
      ) : (
        <>
          <section className="filters-bar">
            {typeOptions.length > 0 && (
              <label className="filter-select">
                <select
                  value={typeFilter}
                  onChange={(e) => updateFilter(setTypeFilter)(e.target.value)}
                >
                  <option value="all">Tất cả loại hình</option>
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </label>
            )}

            <label className="filter-select">
              <select
                value={statusFilter}
                onChange={(e) => updateFilter(setStatusFilter)(e.target.value)}
              >
                <option value="all">Tất cả trạng thái</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </label>

            <label className="search-box filter-search">
              <input
                type="text"
                placeholder="search keyword"
                value={searchTerm}
                onChange={(e) => updateFilter(setSearchTerm)(e.target.value)}
              />
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </label>
          </section>

          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                  <th>HÀNH ĐỘNG</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: '32px' }}>
                      Chưa có đơn đăng ký nào.
                    </td>
                  </tr>
                ) : pageRows.map((row, rowIndex) => (
                  <tr key={row.id}>
                    {columns.map((col) => (
                      <td key={col.key} className={col.className || ''}>
                        {col.render(row, startIndex + rowIndex)}
                      </td>
                    ))}
                    <td>
                      <button
                        type="button"
                        className="icon-btn table-icon-btn"
                        aria-label="Xem chi tiết"
                        onClick={() => setSelectedRow(row)}
                      >
                        <InfoIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalResults={filteredRows.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />

      {selectedRow && (
        <DetailModal
          row={selectedRow}
          sections={buildDetailSections(selectedRow)}
          list={buildDetailList?.(selectedRow) || null}
          canEdit={canEdit}
          onClose={() => setSelectedRow(null)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </>
  )
}

export { formatDateTime, formatFee, StatusPill }
