import { businessTypes } from '../data/businessTypes'
import { PAYMENT_STATUS_LABELS } from '../data/paymentStatusTypes'

const PERIOD_OPTIONS = ['Quý 1/2026', 'Quý 4/2025', 'Quý 3/2025', 'Quý 2/2025']

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export default function RevenueFiltersBar({
  searchTerm,
  onSearchChange,
  businessType,
  onBusinessTypeChange,
  paymentStatus,
  onPaymentStatusChange,
  period,
  onPeriodChange,
  onApply,
}) {
  return (
    <section className="filters-bar revenue-filters-bar">
      <label className="search-box filter-search revenue-search">
        <SearchIcon />
        <input
          type="text"
          placeholder="Nhập Tên đơn vị / MST / Cơ sở kinh doanh..."
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <label className="filter-select">
        <select value={businessType} onChange={(event) => onBusinessTypeChange(event.target.value)}>
          <option value="all">Loại hình kinh doanh</option>
          {Object.entries(businessTypes).map(([key, type]) => (
            <option key={key} value={key}>
              {type.label}
            </option>
          ))}
        </select>
        <ChevronIcon />
      </label>

      <label className="filter-select">
        <select value={paymentStatus} onChange={(event) => onPaymentStatusChange(event.target.value)}>
          <option value="all">Trạng thái thanh toán: Tất cả</option>
          {Object.entries(PAYMENT_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <ChevronIcon />
      </label>

      <label className="filter-select">
        <select value={period} onChange={(event) => onPeriodChange(event.target.value)}>
          {PERIOD_OPTIONS.map((option) => (
            <option key={option} value={option}>
              Thời gian: {option}
            </option>
          ))}
        </select>
        <ChevronIcon />
      </label>

      <button type="button" className="btn btn-primary revenue-filter-btn" onClick={onApply}>
        Lọc dữ liệu
      </button>
    </section>
  )
}
