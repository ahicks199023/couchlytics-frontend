'use client'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show pages around current page
      let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
              const end = Math.min(totalPages, start + maxVisible - 1)
      
      // Adjust start if we're near the end
      if (end === totalPages) {
        start = Math.max(1, end - maxVisible + 1)
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
    }
    
    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="pagination-btn prev-btn"
        title="Previous page"
      >
        ← Previous
      </button>
      
      <div className="page-numbers">
        {pageNumbers[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="pagination-btn page-btn"
            >
              1
            </button>
            {pageNumbers[0] > 2 && (
              <span className="pagination-ellipsis">...</span>
            )}
          </>
        )}
        
        {pageNumbers.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`pagination-btn page-btn ${page === currentPage ? 'active' : ''}`}
          >
            {page}
          </button>
        ))}
        
        {pageNumbers[pageNumbers.length - 1] < totalPages && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
              <span className="pagination-ellipsis">...</span>
            )}
            <button
              onClick={() => onPageChange(totalPages)}
              className="pagination-btn page-btn"
            >
              {totalPages}
            </button>
          </>
        )}
      </div>
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="pagination-btn next-btn"
        title="Next page"
      >
        Next →
      </button>
    </div>
  )
}
