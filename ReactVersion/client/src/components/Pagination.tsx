import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  // Generate array of page numbers to display
  const getPaginationItems = () => {
    const items = [];
    const maxPagesShown = 5; // Show at most 5 page numbers
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesShown / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesShown - 1);
    
    // Adjust if we're at the end of the range
    if (endPage - startPage + 1 < maxPagesShown) {
      startPage = Math.max(1, endPage - maxPagesShown + 1);
    }
    
    // First page
    if (startPage > 1) {
      items.push(1);
      if (startPage > 2) items.push('...');
    }
    
    // Middle pages
    for (let i = startPage; i <= endPage; i++) {
      items.push(i);
    }
    
    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) items.push('...');
      items.push(totalPages);
    }
    
    return items;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="pagination" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      margin: '20px 0',
      gap: '8px'
    }}>
      <button 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          padding: '5px 10px',
          border: '1px solid #ddd',
          borderRadius: '5px',
          background: currentPage === 1 ? '#f5f5f5' : '#fff',
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
        }}
      >
        &laquo; Previous
      </button>
      
      {getPaginationItems().map((item, index) => (
        <button
          key={index}
          onClick={() => typeof item === 'number' ? onPageChange(item) : null}
          disabled={item === '...'}
          style={{
            padding: '5px 10px',
            border: typeof item === 'number' && item === currentPage 
              ? '1px solid #007bff' 
              : '1px solid #ddd',
            borderRadius: '5px',
            background: typeof item === 'number' && item === currentPage 
              ? '#007bff' 
              : '#fff',
            color: typeof item === 'number' && item === currentPage 
              ? '#fff' 
              : '#000',
            cursor: typeof item === 'number' ? 'pointer' : 'default'
          }}
        >
          {item}
        </button>
      ))}
      
      <button 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          padding: '5px 10px',
          border: '1px solid #ddd',
          borderRadius: '5px',
          background: currentPage === totalPages ? '#f5f5f5' : '#fff',
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
        }}
      >
        Next &raquo;
      </button>
    </div>
  );
};

export default Pagination;