import logo from '../assets/Appacmc-logo.png'

const navItems = [
  { key: 'overview', label: 'Tổng quan', icon: 'dashboard' },
  { key: 'units', label: 'Đơn vị sử dụng', icon: 'building' },
  { key: 'revenue', label: 'Doanh thu thu phí', icon: 'money' },
  { key: 'artists', label: 'Tra Cứu Nghệ Sĩ', icon: 'artist' },
  { key: 'admin', label: 'Quản trị hệ thống', icon: 'settings' },
]

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="8.2" r="1" fill="currentColor" />
      <path d="M12 11.5v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M4 21V9l8-6 8 6v12" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 21v-7h6v7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

function MoneyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 10h8M8 14h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function ArtistIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M19.4 12a7.4 7.4 0 0 0-.1-1l2-1.5-2-3.5-2.4.9a7.4 7.4 0 0 0-1.7-1L12.6 2h-1.2l-.2 2.4a7.4 7.4 0 0 0-1.7 1l-2.4-.9-2 3.5 2 1.5a7.4 7.4 0 0 0 0 2l-2 1.5 2 3.5 2.4-.9a7.4 7.4 0 0 0 1.7 1l.2 2.4h1.2l.2-2.4a7.4 7.4 0 0 0 1.7-1l2.4.9 2-3.5-2-1.5a7.4 7.4 0 0 0 .1-1Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

const ICON_MAP = {
  dashboard: DashboardIcon,
  building: BuildingIcon,
  money: MoneyIcon,
  artist: ArtistIcon,
  settings: SettingsIcon,
}

export default function Sidebar({ active, onNavigate, role }) {
  const items = navItems.filter((item) => item.key !== 'admin' || role === 'admin')

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img className="logo-mark" src={logo} alt="APPA CMC" />
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => {
          const Icon = ICON_MAP[item.icon] ?? DashboardIcon
          return (
            <button
              key={item.key}
              type="button"
              className={`sidebar-nav-item${active === item.key ? ' active' : ''}`}
              onClick={() => onNavigate?.(item.key)}
            >
              <Icon />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
