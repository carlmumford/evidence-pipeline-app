import React from 'react';
import type { Document } from '../types';
import { ResultCard } from './ResultCard';

interface SavedListProps {
  savedDocuments: Document[];
  onToggleSave: (doc: Document) => void;
  onCite: (doc: Document) => void;
  onReturn: () => void;
}

export const SavedList: React.FC<SavedListProps> = ({ savedDocuments, onToggleSave, onCite, onReturn }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300">My Saved List ({savedDocuments.length})</h2>
        <button 
            onClick={onReturn}
            className="px-4 py-2 text-sm bg-base-200 dark:bg-dark-base-100 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-base-300 dark:hover:bg-dark-base-200 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-opacity-75 transition-colors"
        >
          &larr; Back to Search
        </button>
      </div>

      {savedDocuments.length > 0 ? (
        <div className="space-y-4">
          {savedDocuments.map(doc => (
            <ResultCard
              key={doc.id}
              document={doc}
              isSaved={true}
              onToggleSave={() => onToggleSave(doc)}
              onCite={() => onCite(doc)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 px-6 bg-base-100 dark:bg-dark-base-300 rounded-lg">
          <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Your List is Empty</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Click the "Add to List" button on a search result to save it here.
          </p>
        </div>
      )}
    </div>
  );
};
