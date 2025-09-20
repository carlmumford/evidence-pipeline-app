
import React from 'react';
import type { Document } from '../types';
import { ResultCard, ResultCardSkeleton } from './ResultCard';
import { Pagination } from './Pagination';

interface ResultsListProps {
  results: Document[];
  isLoading: boolean;
  hasSearched: boolean;
  // For saving to list
  savedDocIds: string[];
  onToggleSave: (doc: Document) => void;
  // For citation
  onCite: (doc: Document) => void;
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
  currentPage,
  totalResults,
  resultsPerPage,
  onPageChange
}) => {
  if (isLoading && results.length === 0) {
    return (
      <div>
        <h3 className="text-2xl font-semibold mb-4 text-slate-700 dark:text-slate-300">Search Results</h3>
        <div className="space-y-4">
          <ResultCardSkeleton />
          <ResultCardSkeleton />
          <ResultCardSkeleton />
        </div>
      </div>
    );
  }

  if (!hasSearched) {
    return (
      <div className="text-center py-10 px-6 bg-base-100 dark:bg-dark-base-300 rounded-lg">
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Ready to start your research?</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Enter a term in the search bar above to find relevant documents.</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-10 px-6 bg-base-100 dark:bg-dark-base-300 rounded-lg">
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">No Results Found</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2">We couldn't find any documents matching your search. Try adjusting your filters or using a different term.</p>
      </div>
    );
  }

  const totalPages = Math.ceil(totalResults / resultsPerPage);

  return (
    <div>
      <h3 className="text-2xl font-semibold mb-4 text-slate-700 dark:text-slate-300">
        {`Search Results (${totalResults})`}
      </h3>
      <div className="space-y-4">
        {results.map((doc) => (
          <ResultCard 
            key={doc.id} 
            document={doc}
            isSaved={savedDocIds.includes(doc.id)}
            onToggleSave={() => onToggleSave(doc)}
            onCite={() => onCite(doc)}
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
