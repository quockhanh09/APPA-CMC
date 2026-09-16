const filters = [
  { key: 'businessType', label: 'Loại hình kinh doanh' },
  { key: 'licenseTerm', label: 'Thời hạn cấp phép' },
  { key: 'time', label: 'Thời gian' },
  { key: 'status', label: 'Trạng thái xử lý' },
]

export default function FiltersBar() {
  return (
    <section className="filters-bar">
      {filters.map((filter) => (
        <label key={filter.key} className="filter-select">
          <select defaultValue="">
            <option value="" disabled>
              {filter.label}
            </option>
          </select>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </label>
      ))}

      <label className="search-box filter-search">
        <input type="text" placeholder="search keyword" />
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
          <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </label>

      <button type="button" className="btn btn-outline export-btn">
        Xuất File Excel
      </button>
    </section>
  )
}
