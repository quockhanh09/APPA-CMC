export default function Topbar() {
  return (
    <header className="topbar">
      <label className="search-box">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
          <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input type="text" placeholder="search keyword" />
      </label>

      <div className="topbar-actions">
        <button type="button" className="icon-btn" aria-label="Thông báo">
          <svg viewBox="0 0 24 24" width="19" height="19" fill="none" aria-hidden="true">
            <path
              d="M12 3a5.5 5.5 0 0 0-5.5 5.5v2.6c0 .6-.2 1.2-.6 1.7L4.5 14.6c-.6.8 0 2 1 2h13c1 0 1.6-1.2 1-2l-1.4-1.8c-.4-.5-.6-1.1-.6-1.7V8.5A5.5 5.5 0 0 0 12 3Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M9.5 19a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <div className="admin-profile">
          <span className="avatar">🦁</span>
          <span className="admin-label">ADMIN</span>
        </div>
      </div>
    </header>
  )
}
