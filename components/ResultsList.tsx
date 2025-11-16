import React from 'react';
import type { Document } from '../types';
import { ResultCard, ResultCardSkeleton } from './ResultCard';
import { Pagination } from './Pagination';

interface ResultsListProps {
  results: Document[];
  isLoading: boolean;
  savedDocIds: string[];
  onToggleSave: (doc: Document) => void;
  onCite: (doc: Document) => void;
  onFindRelated: (doc: Document) => void;
  onViewPdf: (doc: Document) => void;
  onAuthorClick: (author: string) => void;
  currentPage: number;
  totalResults: number;
  resultsPerPage: number;
  onPageChange: (page: number) => void;
}

export const ResultsList: React.FC<ResultsListProps> = ({ 
  results, 
  isLoading, 
  savedDocIds,
  onToggleSave,
  onCite,
  onFindRelated,
  onViewPdf,
  onAuthorClick,
  currentPage,
  totalResults,
  resultsPerPage,
  onPageChange
}) => {
  if (isLoading) {
    return (
      <div className="border-t border-gray-200 dark:border-gray-800">
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 animate-pulse">
            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </div>
        {[...Array(10)].map((_, i) => <ResultCardSkeleton key={i} />)}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-20 px-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Results Found</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">We couldn't find any documents matching your search. Try a different term or adjust your filters.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(totalResults / resultsPerPage);

  return (
    <div>
        <div className="px-4 md:px-6 py-2 border-y border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{`Showing ${results.length} of ${totalResults} results`}</p>
        </div>
      <div className="border-b border-gray-200 dark:border-gray-800">
        {results.map((doc) => (
          <ResultCard 
            key={doc.id} 
            document={doc}
            isSaved={savedDocIds.includes(doc.id)}
            onToggleSave={() => onToggleSave(doc)}
            onCite={() => onCite(doc)}
            onFindRelated={() => onFindRelated(doc)}
            onViewPdf={() => onViewPdf(doc)}
            onAuthorClick={onAuthorClick}
          />
        ))}
      </div>
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};