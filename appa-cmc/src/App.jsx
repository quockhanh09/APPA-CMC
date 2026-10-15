import { useCallback, useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import StatsOverview from './components/StatsOverview'
import FiltersBar from './components/FiltersBar'
import DataTable from './components/DataTable'
import Pagination from './components/Pagination'
import AdminManagement from './components/AdminManagement'
import ArtistLookupView from './components/ArtistLookupView'
import RevenueStats from './components/RevenueStats'
import RevenueFiltersBar from './components/RevenueFiltersBar'
import RevenueTable from './components/RevenueTable'
import Login from './components/Login'
import NewApplicationForm from './components/NewApplicationForm'
import { fetchApplications, getStoredUser, clearSession } from './api'
import { revenueRows } from './data/revenue'
import './App.css'

const PAGE_SIZE = 10

function RegistrationDashboard({ canEdit }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const totalPages = Math.max(1, Math.ceil(applications.length / PAGE_SIZE))

  const loadApplications = useCallback(async () => {
    try {
      const data = await fetchApplications()
      setApplications(data.applications)
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadApplications()
    const interval = setInterval(loadApplications, 15000)
    return () => clearInterval(interval)
  }, [loadApplications])

  return (
    <>
      <div className="page-header">
        <div>
          <h1>BẢNG QUẢN LÝ HỒ SƠ ĐĂNG KÝ</h1>
          <p>Theo dõi và xử lý các đơn đăng ký bản quyền âm nhạc</p>
        </div>
        {canEdit && (
          <button type="button" className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
            TẠO ĐƠN MỚI
            <span aria-hidden="true">+</span>
          </button>
        )}
      </div>

      <StatsOverview applications={applications} />
      {error && <p className="login-error" role="alert">Không thể tải hồ sơ đăng ký: {error}</p>}
      {loading ? (
        <p role="status">Đang tải hồ sơ đăng ký...</p>
      ) : (
        <>
          <FiltersBar />
          <DataTable
            applications={applications}
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            canEdit={canEdit}
          />
        </>
      )}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalResults={applications.length}
        pageSize={PAGE_SIZE}
        onPageChange={setCurrentPage}
      />

      {showCreateForm && (
        <NewApplicationForm
          onClose={() => setShowCreateForm(false)}
          onCreated={() => {
            setShowCreateForm(false)
            loadApplications()
          }}
        />
      )}
    </>
  )
}

function RevenueDashboard() {
  const [searchTerm, setSearchTerm] = useState('')
  const [businessType, setBusinessType] = useState('all')
  const [paymentStatus, setPaymentStatus] = useState('all')
  const [period, setPeriod] = useState('Quý 1/2026')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return revenueRows.filter((row) => {
      const matchesSearch =
        !term ||
        row.unit.toLowerCase().includes(term) ||
        row.taxCode.toLowerCase().includes(term) ||
        row.facility.toLowerCase().includes(term)
      const matchesType = businessType === 'all' || row.type === businessType
      const matchesStatus = paymentStatus === 'all' || row.status.tone === paymentStatus
      return matchesSearch && matchesType && matchesStatus
    })
  }, [searchTerm, businessType, paymentStatus])

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))

  const updateFilter = (setter) => (value) => {
    setter(value)
    setCurrentPage(1)
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1>DOANH THU THU PHÍ</h1>
          <p>Theo dõi doanh thu đã thu, doanh thu còn nợ và chi phí vận hành theo từng đơn vị sử dụng</p>
        </div>
      </div>

      <RevenueStats rows={filteredRows} />
      <RevenueFiltersBar
        searchTerm={searchTerm}
        onSearchChange={updateFilter(setSearchTerm)}
        businessType={businessType}
        onBusinessTypeChange={updateFilter(setBusinessType)}
        paymentStatus={paymentStatus}
        onPaymentStatusChange={updateFilter(setPaymentStatus)}
        period={period}
        onPeriodChange={setPeriod}
        onApply={() => setCurrentPage(1)}
      />
      <RevenueTable rows={filteredRows} currentPage={currentPage} pageSize={PAGE_SIZE} />
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalResults={filteredRows.length}
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

  const canEdit = Boolean(user?.permissions?.edit ?? user?.isMainAdmin)

  return (
    <div className="cms-layout">
      <Sidebar active={activeNav} onNavigate={setActiveNav} role={user.role} />
      <div className="cms-main">
        <Topbar user={user} onLogout={handleLogout} onUserUpdated={setUser} />
        <main className="cms-content">
          {activeNav === 'overview' && <RegistrationDashboard canEdit={canEdit} />}
          {activeNav === 'units' && <ComingSoon title="ĐƠN VỊ SỬ DỤNG" />}
          {activeNav === 'revenue' && <RevenueDashboard />}
          {activeNav === 'artists' && <ArtistLookupView />}
          {activeNav === 'admin' && user.role === 'admin' && <AdminManagement currentUser={user} />}
        </main>
      </div>
    </div>
  )
}

export default App
