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
    const maxPagesShown = 3; // Show at most 3 page numbers
    
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

  // Theme colors from the app's CSS variables
  const primaryColor = '#89C9B8';
  const darkBg = '#212121';
  const navBg = '#3F3F3F';
  const textColor = '#FFFFFF';

  const baseButtonStyle = {
    padding: '8px 12px',
    border: `1px solid ${primaryColor}`,
    borderRadius: '10px',
    background: darkBg,
    color: textColor,
    fontSize: '16px',
    minWidth: '40px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  };

  const disabledButtonStyle = {
    ...baseButtonStyle,
    opacity: 0.5,
    cursor: 'not-allowed',
    border: `1px solid ${navBg}`
  };

  const activeButtonStyle = {
    ...baseButtonStyle,
    background: primaryColor,
    color: darkBg,
    fontWeight: 'bold'
  };

  return (
    <div className="pagination" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      margin: '30px 0',
      gap: '8px'
    }}>
      <button 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={currentPage === 1 ? disabledButtonStyle : baseButtonStyle}
      >
        &laquo;
      </button>
      
      {getPaginationItems().map((item, index) => (
        <button
          key={index}
          onClick={() => typeof item === 'number' ? onPageChange(item) : null}
          disabled={item === '...'}
          style={
            item === '...' ? disabledButtonStyle :
            typeof item === 'number' && item === currentPage ? activeButtonStyle : baseButtonStyle
          }
        >
          {item}
        </button>
      ))}
      
      <button 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={currentPage === totalPages ? disabledButtonStyle : baseButtonStyle}
      >
        &raquo;
      </button>
    </div>
  );
};

export default Pagination;