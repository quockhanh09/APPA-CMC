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
import PerformanceRegistrationsView from './components/PerformanceRegistrationsView'
import CopyRegistrationsView from './components/CopyRegistrationsView'
import UnitsView from './components/UnitsView'
import WorkspaceTabs from './components/WorkspaceTabs'
import { fetchApplications, deleteApplication, getStoredUser, clearSession } from './api'
import { buildRevenueRows } from './data/revenue'
import './App.css'

const PAGE_SIZE = 10

const NAV_ITEMS = [
  { key: 'overview', label: 'Tổng quan', icon: '📊' },
  { key: 'units', label: 'Đơn vị sử dụng', icon: '🏢' },
  { key: 'performance', label: 'Tổ chức biểu diễn', icon: '🎭' },
  { key: 'copy', label: 'Đăng ký sao chép', icon: '📋' },
  { key: 'revenue', label: 'Doanh thu thu phí', icon: '💰' },
  { key: 'artists', label: 'Tra Cứu Nghệ Sĩ', icon: '🎤' },
  { key: 'admin', label: 'Quản trị hệ thống', icon: '⚙️' },
]

function generateTabId(navKey, detailId = null) {
  return detailId ? `${navKey}-${detailId}` : navKey
}

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

  const handleDeleteApplication = async (id) => {
    await deleteApplication(id)
    loadApplications()
  }

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
            onDelete={handleDeleteApplication}
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
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const rows = useMemo(() => buildRevenueRows(applications), [applications])

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesSearch =
        !term ||
        row.unit.toLowerCase().includes(term) ||
        row.taxCode.toLowerCase().includes(term) ||
        row.facility.toLowerCase().includes(term)
      const matchesType = businessType === 'all' || row.type === businessType
      const matchesStatus = paymentStatus === 'all' || row.status.tone === paymentStatus
      return matchesSearch && matchesType && matchesStatus
    })
  }, [rows, searchTerm, businessType, paymentStatus])

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
      {error && <p className="login-error" role="alert">Không thể tải dữ liệu doanh thu: {error}</p>}
      {loading ? (
        <p role="status">Đang tải dữ liệu doanh thu...</p>
      ) : (
        <>
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
        </>
      )}
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

function TabContentWrapper({ children, isActive }) {
  return (
    <div
      className={`tab-content-wrapper${isActive ? ' active' : ''}`}
      role="tabpanel"
      aria-hidden={!isActive}
      hidden={!isActive}
      style={{ display: isActive ? 'block' : 'none' }}
    >
      {children}
    </div>
  )
}

function renderTabContent(navKey, canEdit, currentUser, detailId = null, detailData = null) {
  switch (navKey) {
    case 'overview':
      return <RegistrationDashboard canEdit={canEdit} key={generateTabId('overview')} />
    case 'units':
      return <UnitsView canEdit={canEdit} key={generateTabId('units', detailId)} detailId={detailId} detailData={detailData} />
    case 'performance':
      return <PerformanceRegistrationsView canEdit={canEdit} key={generateTabId('performance', detailId)} detailId={detailId} detailData={detailData} />
    case 'copy':
      return <CopyRegistrationsView canEdit={canEdit} key={generateTabId('copy', detailId)} detailId={detailId} detailData={detailData} />
    case 'revenue':
      return <RevenueDashboard key={generateTabId('revenue')} />
    case 'artists':
      return <ArtistLookupView canEdit={canEdit} key={generateTabId('artists', detailId)} detailId={detailId} detailData={detailData} />
    case 'admin':
      return <AdminManagement currentUser={currentUser} key={generateTabId('admin')} />
    default:
      return <RegistrationDashboard canEdit={canEdit} key={generateTabId('overview')} />
  }
}

function App() {
  const [user, setUser] = useState(getStoredUser)
  const [tabs, setTabs] = useState([
    { id: 'overview', key: 'overview', label: 'Tổng quan', icon: '📊', detailId: null, detailData: null }
  ])
  const [activeTabId, setActiveTabId] = useState('overview')

  if (!user) {
    return <Login onLoginSuccess={setUser} />
  }

  const handleLogout = () => {
    clearSession()
    setUser(null)
    setTabs([{ id: 'overview', key: 'overview', label: 'Tổng quan', icon: '📊', detailId: null, detailData: null }])
    setActiveTabId('overview')
  }

  const canEdit = Boolean(user?.permissions?.edit ?? user?.isMainAdmin)
  const isAdmin = user.role === 'admin'

  const filteredNavItems = NAV_ITEMS.filter(item => item.key !== 'admin' || isAdmin)

  const openTab = (navKey, detailId = null, detailData = null) => {
    const tabId = generateTabId(navKey, detailId)
    
    setTabs(prev => {
      const existingTab = prev.find(t => t.id === tabId)
      if (existingTab) {
        return prev.map(t => t.id === tabId ? { ...t, detailData: detailData || t.detailData } : t)
      }
      const navItem = filteredNavItems.find(item => item.key === navKey)
      const detailName = detailData?.name || detailData?.companyName || detailData?.facilityName || detailData?.orgName || detailData?.orgNameVN || detailData?.contentTitle || detailId
      return [...prev, {
        id: tabId,
        key: navKey,
        label: navItem?.label || navKey,
        icon: navItem?.icon || '📄',
        detailId,
        detailName,
        detailData,
      }]
    })
    setActiveTabId(tabId)
  }

  const closeTab = (tabId) => {
    setTabs(prev => {
      const index = prev.findIndex(t => t.id === tabId)
      if (index === -1) return prev
      const newTabs = prev.filter(t => t.id !== tabId)
      if (activeTabId === tabId) {
        const newActive = newTabs[index] || newTabs[index - 1] || newTabs[0]
        if (newActive) {
          setActiveTabId(newActive.id)
        }
      }
      return newTabs
    })
  }

  const closeOthers = (keepTabId) => {
    setTabs(prev => {
      const keepTab = prev.find(t => t.id === keepTabId)
      if (!keepTab) return prev
      if (activeTabId !== keepTabId) {
        setActiveTabId(keepTabId)
      }
      return [keepTab]
    })
  }

  const closeAll = () => {
    setTabs([{ id: 'overview', key: 'overview', label: 'Tổng quan', icon: '📊', detailId: null, detailData: null }])
    setActiveTabId('overview')
  }

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0]

  return (
    <div className="cms-layout">
      <Sidebar active={activeTab.key} onNavigate={(navKey) => openTab(navKey)} role={user.role} />
      <div className="cms-main">
        <Topbar user={user} onLogout={handleLogout} onUserUpdated={setUser} />
        <WorkspaceTabs
          tabs={tabs}
          activeTabId={activeTabId}
          onActivateTab={setActiveTabId}
          onCloseTab={closeTab}
          onCloseOthers={closeOthers}
          onCloseAll={closeAll}
        />
        <main className="cms-content">
          {tabs.map((tab) => (
            <TabContentWrapper key={tab.id} isActive={tab.id === activeTabId}>
              {renderTabContent(tab.key, canEdit, user, tab.detailId, tab.detailData)}
            </TabContentWrapper>
          ))}
        </main>
      </div>
    </div>
  )
}

export default App
