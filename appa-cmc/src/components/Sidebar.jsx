const navItems = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'units', label: 'Đơn vị sử dụng' },
  { key: 'revenue', label: 'Doanh thu thu phí' },
  { key: 'admin', label: 'Quản trị hệ thống' },
]

function NavIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="8.2" r="1" fill="currentColor" />
      <path d="M12 11.5v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

export default function Sidebar({ active, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-mark" aria-hidden="true"></span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`sidebar-nav-item${active === item.key ? ' active' : ''}`}
            onClick={() => onNavigate?.(item.key)}
          >
            <NavIcon />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
