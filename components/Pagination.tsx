import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PageButton: React.FC<{
  onClick: () => void;
  disabled?: boolean;
  isActive?: boolean;
  children: React.ReactNode;
}> = ({ onClick, disabled, isActive, children }) => {
  const baseClasses = 'px-3 py-2 text-sm font-medium border border-base-300 dark:border-slate-700 disabled:opacity-50';
  const activeClasses = 'bg-brand-primary text-white border-brand-primary';
  const defaultClasses = 'bg-base-100 dark:bg-dark-base-300 hover:bg-base-200 dark:hover:bg-dark-base-200';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${isActive ? activeClasses : defaultClasses}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {children}
    </button>
  );
};

export const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    // Logic to show a limited number of page buttons (e.g., 1, 2, ..., 5, 6, 7, ..., 10)
    const pageNumbers = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      pageNumbers.push(1);
      if (currentPage > 3) {
        pageNumbers.push('...');
      }
      if (currentPage > 2) {
        pageNumbers.push(currentPage - 1);
      }
      if (currentPage !== 1 && currentPage !== totalPages) {
        pageNumbers.push(currentPage);
      }
      if (currentPage < totalPages - 1) {
        pageNumbers.push(currentPage + 1);
      }
      if (currentPage < totalPages - 2) {
        pageNumbers.push('...');
      }
      pageNumbers.push(totalPages);
    }
    return [...new Set(pageNumbers)]; // Remove duplicates
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav className="flex justify-center items-center space-x-1 mt-8" aria-label="Pagination">
      <PageButton
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </PageButton>
      {pageNumbers.map((page, index) =>
        typeof page === 'number' ? (
          <PageButton
            key={index}
            onClick={() => onPageChange(page)}
            isActive={currentPage === page}
          >
            {page}
          </PageButton>
        ) : (
          <span key={index} className="px-3 py-2 text-sm font-medium">
            {page}
          </span>
        )
      )}
      <PageButton
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </PageButton>
    </nav>
  );
};
