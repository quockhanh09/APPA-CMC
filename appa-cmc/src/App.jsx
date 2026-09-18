import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import StatsOverview from './components/StatsOverview'
import FiltersBar from './components/FiltersBar'
import DataTable from './components/DataTable'
import Pagination from './components/Pagination'
import AdminManagement from './components/AdminManagement'
import Login from './components/Login'
import { applications } from './data/applications'
import { getStoredUser, clearSession } from './api'
import './App.css'

const PAGE_SIZE = 10

function RegistrationDashboard() {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(applications.length / PAGE_SIZE)

  return (
    <>
      <div className="page-header">
        <div>
          <h1>BẢNG QUẢN LÝ HỒ SƠ ĐĂNG KÝ</h1>
          <p>Theo dõi và xử lý các đơn đăng ký bản quyền âm nhạc</p>
        </div>
        <button type="button" className="btn btn-primary">
          TẠO ĐƠN MỚI
          <span aria-hidden="true">+</span>
        </button>
      </div>

      <StatsOverview />
      <FiltersBar />
      <DataTable currentPage={currentPage} pageSize={PAGE_SIZE} />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalResults={applications.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />
    </>
  )
}

function ComingSoon({ title }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        <p>Tính năng đang được phát triển</p>
      </div>
    </div>
  )
}

function App() {
  const [activeNav, setActiveNav] = useState('overview')
  const [user, setUser] = useState(getStoredUser)

  if (!user) {
    return <Login onLoginSuccess={setUser} />
  }

  const handleLogout = () => {
    clearSession()
    setUser(null)
    setActiveNav('overview')
  }

  return (
    <div className="cms-layout">
      <Sidebar active={activeNav} onNavigate={setActiveNav} role={user.role} />
      <div className="cms-main">
        <Topbar user={user} onLogout={handleLogout} onUserUpdated={setUser} />
        <main className="cms-content">
          {activeNav === 'overview' && <RegistrationDashboard />}
          {activeNav === 'units' && <ComingSoon title="ĐƠN VỊ SỬ DỤNG" />}
          {activeNav === 'revenue' && <ComingSoon title="DOANH THU THU PHÍ" />}
          {activeNav === 'admin' && user.role === 'admin' && <AdminManagement />}
        </main>
      </div>
    </div>
  )
}

export default App
