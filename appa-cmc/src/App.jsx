import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Topbar from './components/Topbar'
import StatsOverview from './components/StatsOverview'
import FiltersBar from './components/FiltersBar'
import DataTable from './components/DataTable'
import Pagination from './components/Pagination'
import { applications } from './data/applications'
import './App.css'

const PAGE_SIZE = 10

function App() {
  const [activeNav, setActiveNav] = useState('overview')
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(applications.length / PAGE_SIZE)

  return (
    <div className="cms-layout">
      <Sidebar active={activeNav} onNavigate={setActiveNav} />
      <div className="cms-main">
        <Topbar />
        <main className="cms-content">
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
        </main>
      </div>
    </div>
  )
}

export default App
