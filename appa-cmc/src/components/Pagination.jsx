export default function Pagination({ currentPage, totalPages, totalResults, pageSize, onPageChange }) {
  const shownCount = Math.min(pageSize, totalResults - (currentPage - 1) * pageSize)
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <footer className="pagination">
      <span className="pagination-info">
        Hiển thị {shownCount}/{totalResults} kết quả
      </span>
      <div className="pagination-controls">
        <button
          type="button"
          className="page-btn"
          aria-label="Trang trước"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            className={`page-btn${page === currentPage ? ' active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ))}
        <button
          type="button"
          className="page-btn"
          aria-label="Trang sau"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </footer>
  )
}
