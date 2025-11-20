import React from 'react';
import type { Document } from '../types';
import { ResultCard, ResultCardSkeleton } from './ResultCard';
import { Pagination } from './Pagination';
import { SearchIcon, LoadingSpinner } from '../constants';

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
        <div className="flex items-center justify-center py-12">
            <div className="text-center">
                 <LoadingSpinner className="h-8 w-8 text-accent mx-auto mb-4" />
                 <p className="text-gray-500 dark:text-gray-400 font-medium">Searching evidence database...</p>
            </div>
        </div>
        <div className="opacity-50 pointer-events-none">
             {[...Array(3)].map((_, i) => <ResultCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-20 px-6 bg-white dark:bg-gray-900">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
            <SearchIcon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">No Evidence Found</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
            We couldn't find any documents matching your criteria. This might be because the term is too specific or filters are too restrictive.
        </p>
        
        <div className="text-left max-w-md mx-auto bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">Suggestions:</h4>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>Check your spelling or try a synonym (e.g., "exclusion" instead of "kicking out").</li>
                <li>Remove some filters to broaden your search.</li>
                <li>Try searching for a broader topic like "discipline" or "justice".</li>
            </ul>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalResults / resultsPerPage);

  return (
    <div>
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