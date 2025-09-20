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
  const baseClasses = 'px-3 py-1.5 text-sm font-medium rounded-md disabled:opacity-50 transition-colors';
  const activeClasses = 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100';
  const defaultClasses = 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800';
  
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
    return [...new Set(pageNumbers)];
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex justify-center items-center p-4 border-t border-gray-200 dark:border-gray-800">
        <nav className="flex items-center space-x-2" aria-label="Pagination">
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
                <span key={index} className="px-3 py-1.5 text-sm font-medium text-gray-500">
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
    </div>
  );
};