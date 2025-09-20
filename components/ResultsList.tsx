import React from 'react';
import type { Document } from '../types';
import { ResultCard, ResultCardSkeleton } from './ResultCard';
import { Pagination } from './Pagination';
import { SearchIcon } from '../constants';

interface ResultsListProps {
  results: Document[];
  isLoading: boolean;
  hasSearched: boolean;
  // For saving to list
  savedDocIds: string[];
  onToggleSave: (doc: Document) => void;
  // For citation
  onCite: (doc: Document) => void;
  // For finding related documents
  onFindRelated: (doc: Document) => void;
  // For viewing PDF
  onViewPdf: (doc: Document) => void;
  // For clickable authors
  onAuthorClick: (author: string) => void;
  // For pagination
  currentPage: number;
  totalResults: number;
  resultsPerPage: number;
  onPageChange: (page: number) => void;
}

export const ResultsList: React.FC<ResultsListProps> = ({ 
  results, 
  isLoading, 
  hasSearched,
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
  if (isLoading && results.length === 0) {
    return (
      <div className="border-t border-gray-200 dark:border-gray-800">
        <ResultCardSkeleton />
        <ResultCardSkeleton />
        <ResultCardSkeleton />
        <ResultCardSkeleton />
        <ResultCardSkeleton />
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div className="text-center py-20 px-6">
        <SearchIcon className="h-12 w-12 text-gray-300 dark:text-gray-700 mx-auto mb-4"/>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Ready for discovery?</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Enter a search term above to find relevant documents.</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-20 px-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No Results Found</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1">We couldn't find any documents matching your search. Try a different term.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(totalResults / resultsPerPage);

  return (
    <div>
        <div className="px-4 py-2 border-y border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
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