import { useCallback, useEffect, useMemo, useState } from 'react'
import Pagination from './Pagination'
import UnitFormModal from './UnitFormModal'
import { fetchUnits, deleteUnit } from '../api'
import { businessTypes } from '../data/businessTypes'
import { statusTypes } from '../data/statusTypes'

const PAGE_SIZE = 10

const STATUS_TABS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'approved', label: 'Đã duyệt' },
  { value: 'pending', label: 'Chưa duyệt' },
  { value: 'empty', label: 'Trống' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'nameAsc', label: 'Tên A → Z' },
  { value: 'nameDesc', label: 'Tên Z → A' },
]

const CATEGORY_OPTIONS = [
  ...Object.entries(businessTypes).map(([value, type]) => ({ value, label: type.label })),
  { value: 'other', label: 'Khác' },
]

const UNIT_STATUS_LABELS = {
  pending: 'Chưa duyệt',
  approved: 'Đã duyệt',
}

// dùng lại bộ màu pill của trang Tổng quan
const UNIT_STATUS_TONES = {
  pending: statusTypes.pending,
  approved: statusTypes.licensed,
}

const LICENSE_TONES = {
  active: statusTypes.licensed,
  expiring: statusTypes.expiring,
  expired: statusTypes.expired,
  none: { bg: '#EEF0F3', dot: '#8A8F9A', border: '#8A8F9A', text: '#8A8F9A' },
}

const LICENSE_LABELS = {
  active: 'Còn hạn',
  expiring: 'Sắp hết hạn',
  expired: 'Hết hạn',
  none: 'Chưa cấp phép',
}

const EXPIRING_SOON_DAYS = 30

function parseDisplayDate(value) {
  if (!value) return null
  const [d, m, y] = String(value).split('/').map(Number)
  if (!d || !m || !y) return null
  const date = new Date(y, m - 1, d)
  return Number.isNaN(date.getTime()) ? null : date
}

// Trạng thái hiệu lực cấp phép: không có mốc nào → "trống"; quá hạn / sắp hết / còn hạn
function getLicenseState(unit) {
  const start = parseDisplayDate(unit.licenseStart)
  const end = parseDisplayDate(unit.licenseEnd)
  if (!start && !end) return 'none'
  if (end) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (end < today) return 'expired'
    const soon = new Date(today)
    soon.setDate(soon.getDate() + EXPIRING_SOON_DAYS)
    if (end <= soon) return 'expiring'
  }
  return 'active'
}

function formatArea(value) {
  if (!Number.isFinite(value)) return ''
  return `${new Intl.NumberFormat('vi-VN').format(value)} m²`
}

function Pill({ tone, label }) {
  return (
    <span
      className="status-pill"
      style={{ '--status-bg': tone.bg, '--status-border': tone.border, '--status-dot': tone.dot, '--status-text': tone.text }}
    >
      <span className="status-dot" />
      {label}
    </span>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <path d="M4 20h4.5L20 8.5a2.1 2.1 0 0 0-3-3L5.5 17 4 20Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M14.5 7.5l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m3 0-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function UnitDetailModal({ unit, onClose }) {
  const licenseState = getLicenseState(unit)
  const sections = [
    {
      title: 'THÔNG TIN DOANH NGHIỆP',
      fields: [
        { label: 'Mã đơn vị', value: unit.id },
        { label: 'Công ty / Doanh nghiệp', value: unit.companyName },
        { label: 'Mã số thuế', value: unit.taxCode },
        { label: 'Loại hình kinh doanh', value: CATEGORY_OPTIONS.find((c) => c.value === unit.category)?.label },
        { label: 'Trạng thái', value: UNIT_STATUS_LABELS[unit.status] || unit.status },
      ],
    },
    {
      title: 'THÔNG TIN CƠ SỞ KINH DOANH',
      fields: [
        { label: 'Cơ sở kinh doanh', value: unit.facilityName },
        { label: 'TP / Tỉnh', value: unit.city },
        { label: 'Phường / Xã', value: unit.ward },
        { label: 'Địa chỉ', value: unit.address },
        { label: 'Diện tích', value: formatArea(unit.areaM2) },
      ],
    },
    {
      title: 'THÔNG TIN CẤP PHÉP',
      fields: [
        { label: 'Thời hạn từ', value: unit.licenseStart },
        { label: 'Thời hạn đến', value: unit.licenseEnd },
        { label: 'Hiệu lực', value: LICENSE_LABELS[licenseState] },
      ],
    },
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card service-detail-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <h2>CHI TIẾT ĐƠN VỊ SỬ DỤNG</h2>
          <Pill tone={UNIT_STATUS_TONES[unit.status] || UNIT_STATUS_TONES.pending} label={UNIT_STATUS_LABELS[unit.status] || unit.status} />
        </div>
        <p className="service-detail-id">MÃ ĐƠN VỊ: {unit.id}</p>

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

        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

function DeleteUnitModal({ unit, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  const handleDelete = async () => {
    if (deleting) return
    setDeleting(true)
    setError('')
    try {
      await deleteUnit(unit.id)
      onDeleted()
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>Xóa đơn vị sử dụng</h2>
        </div>
        <p>
          Bạn có chắc muốn xóa <strong>{unit.companyName}</strong> ({unit.id})? Thao tác này không thể hoàn tác.
        </p>
        {error && <p className="login-error" role="alert">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={deleting}>
            Hủy
          </button>
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Đang xóa...' : 'Xóa đơn vị'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function UnitsView({ canEdit = false }) {
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusTab, setStatusTab] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState(null)
  const [viewingUnit, setViewingUnit] = useState(null)
  const [deletingUnit, setDeletingUnit] = useState(null)

  const loadUnits = useCallback(async () => {
    try {
      const data = await fetchUnits()
      setUnits(data.units || [])
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUnits()
  }, [loadUnits])

  const categoryCounts = useMemo(() => {
    const counts = { all: units.length }
    for (const unit of units) {
      counts[unit.category] = (counts[unit.category] || 0) + 1
    }
    return counts
  }, [units])

  const filteredUnits = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    const rows = units.filter((unit) => {
      const matchesTab =
        statusTab === 'all' ||
        (statusTab === 'empty' ? getLicenseState(unit) === 'none' : unit.status === statusTab)
      const matchesCategory = categoryFilter === 'all' || unit.category === categoryFilter
      const searchText = `${unit.id} ${unit.companyName} ${unit.taxCode} ${unit.facilityName} ${unit.city} ${unit.ward} ${unit.address}`.toLowerCase()
      const matchesSearch = !term || searchText.includes(term)
      return matchesTab && matchesCategory && matchesSearch
    })

    const byName = (a, b) => a.companyName.localeCompare(b.companyName, 'vi')
    const byCreated = (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    switch (sortBy) {
      case 'oldest':
        return [...rows].sort(byCreated)
      case 'nameAsc':
        return [...rows].sort(byName)
      case 'nameDesc':
        return [...rows].sort((a, b) => byName(b, a))
      default:
        return [...rows].sort((a, b) => byCreated(b, a))
    }
  }, [units, statusTab, categoryFilter, searchTerm, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredUnits.length / PAGE_SIZE))
  const startIndex = (currentPage - 1) * PAGE_SIZE
  const pageRows = filteredUnits.slice(startIndex, startIndex + PAGE_SIZE)

  const updateFilter = (setter) => (value) => {
    setter(value)
    setCurrentPage(1)
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>ĐƠN VỊ SỬ DỤNG</h1>
          <p>Quản lý danh sách doanh nghiệp / cơ sở kinh doanh sử dụng âm nhạc</p>
        </div>
        {canEdit && (
          <button type="button" className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <span aria-hidden="true">+</span>
            Thêm
          </button>
        )}
      </div>

      <section className="units-toolbar">
        <div className="units-tabs" role="tablist">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={statusTab === tab.value}
              className={`units-tab${statusTab === tab.value ? ' active' : ''}`}
              onClick={() => updateFilter(setStatusTab)(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <label className="filter-select units-sort">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sắp xếp">
            {SORT_OPTIONS.map((option) => (
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
            placeholder="Tìm theo tên, MST, cơ sở..."
            value={searchTerm}
            onChange={(e) => updateFilter(setSearchTerm)(e.target.value)}
          />
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
            <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </label>
      </section>

      {error && <p className="login-error" role="alert">Không thể tải dữ liệu: {error}</p>}

      <div className="units-body">
        <aside className="units-category-menu">
          <h2 className="units-category-title">Loại hình</h2>
          <button
            type="button"
            className={`units-category-item${categoryFilter === 'all' ? ' active' : ''}`}
            onClick={() => updateFilter(setCategoryFilter)('all')}
          >
            <span>Tất cả</span>
            <span className="units-category-count">{categoryCounts.all || 0}</span>
          </button>
          {CATEGORY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`units-category-item${categoryFilter === option.value ? ' active' : ''}`}
              onClick={() => updateFilter(setCategoryFilter)(option.value)}
            >
              <span>{option.label}</span>
              <span className="units-category-count">{categoryCounts[option.value] || 0}</span>
            </button>
          ))}
        </aside>

        <div className="units-table-area">
          <div className="table-wrapper">
            <table className="data-table units-table">
              <thead>
                <tr>
                  <th className="col-stt">STT</th>
                  <th>CÔNG TY / DOANH NGHIỆP</th>
                  <th>MST</th>
                  <th>CƠ SỞ KINH DOANH</th>
                  <th>TP/TỈNH</th>
                  <th>PHƯỜNG/XÃ</th>
                  <th>ĐỊA CHỈ</th>
                  <th>CẤP PHÉP</th>
                  <th>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }, (_, i) => (
                    <tr key={`skeleton-${i}`} className="units-skeleton-row">
                      <td colSpan={9}>
                        <span className="units-skeleton" />
                      </td>
                    </tr>
                  ))
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="units-empty">
                        <svg viewBox="0 0 24 24" width="40" height="40" fill="none" aria-hidden="true">
                          <path d="M4 21V9l8-6 8 6v12" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                          <path d="M9 21v-7h6v7" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                        </svg>
                        <p>Không có đơn vị sử dụng nào khớp với bộ lọc.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pageRows.map((unit, rowIndex) => {
                    const licenseState = getLicenseState(unit)
                    return (
                      <tr key={unit.id}>
                        <td className="col-stt">{startIndex + rowIndex + 1}</td>
                        <td>
                          <div className="unit-cell">
                            <span className="unit-name">{unit.companyName}</span>
                            <span className="unit-tax">{unit.id}</span>
                          </div>
                        </td>
                        <td>{unit.taxCode || '—'}</td>
                        <td className="cell-wrap">{unit.facilityName || '—'}</td>
                        <td>{unit.city || '—'}</td>
                        <td>{unit.ward || '—'}</td>
                        <td className="cell-wrap">{unit.address || '—'}</td>
                        <td>
                          <div className="license-cell">
                            {licenseState === 'none' ? (
                              <Pill tone={LICENSE_TONES.none} label={LICENSE_LABELS.none} />
                            ) : (
                              <>
                                <span className="license-range">
                                  {unit.licenseStart || '…'} → {unit.licenseEnd || '…'}
                                </span>
                                <span className="license-sub">
                                  {formatArea(unit.areaM2)}
                                  {formatArea(unit.areaM2) && ' · '}
                                  <Pill tone={LICENSE_TONES[licenseState]} label={LICENSE_LABELS[licenseState]} />
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="staff-actions">
                            <button
                              type="button"
                              className="icon-btn table-icon-btn"
                              aria-label="Xem chi tiết"
                              title="Xem chi tiết"
                              onClick={() => setViewingUnit(unit)}
                            >
                              <EyeIcon />
                            </button>
                            {canEdit && (
                              <>
                                <button
                                  type="button"
                                  className="icon-btn table-icon-btn"
                                  aria-label="Chỉnh sửa"
                                  title="Chỉnh sửa"
                                  onClick={() => setEditingUnit(unit)}
                                >
                                  <EditIcon />
                                </button>
                                <button
                                  type="button"
                                  className="icon-btn table-icon-btn unit-delete-btn"
                                  aria-label="Xóa"
                                  title="Xóa"
                                  onClick={() => setDeletingUnit(unit)}
                                >
                                  <TrashIcon />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalResults={filteredUnits.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {showCreateModal && (
        <UnitFormModal
          onClose={() => setShowCreateModal(false)}
          onSaved={() => {
            setShowCreateModal(false)
            loadUnits()
          }}
        />
      )}

      {editingUnit && (
        <UnitFormModal
          unit={editingUnit}
          onClose={() => setEditingUnit(null)}
          onSaved={() => {
            setEditingUnit(null)
            loadUnits()
          }}
        />
      )}

      {viewingUnit && (
        <UnitDetailModal
          unit={viewingUnit}
          onClose={() => setViewingUnit(null)}
        />
      )}

      {deletingUnit && (
        <DeleteUnitModal
          unit={deletingUnit}
          onClose={() => setDeletingUnit(null)}
          onDeleted={() => {
            setDeletingUnit(null)
            loadUnits()
          }}
        />
      )}
    </>
  )
}

export { getLicenseState, UNIT_STATUS_LABELS }
