import React from 'react';
import type { Document } from '../types';
import { ResultCard } from './ResultCard';
import { DownloadIcon } from '../constants';

interface SavedListProps {
  savedDocuments: Document[];
  onToggleSave: (doc: Document) => void;
  onCite: (doc: Document) => void;
  onReturn: () => void;
  onFindRelated: (doc: Document) => void;
  onViewPdf: (doc: Document) => void;
  onAuthorClick: (author: string) => void;
}

export const SavedList: React.FC<SavedListProps> = ({ savedDocuments, onToggleSave, onCite, onReturn, onFindRelated, onViewPdf, onAuthorClick }) => {
  const handleExportToCSV = () => {
    if (savedDocuments.length === 0) return;

    const headers = ["Title", "Authors", "Year", "Summary", "Subjects", "Risk Factors", "Interventions", "Key Populations", "URL"];
    
    const rows = savedDocuments.map(doc => {
      const escapeCsvField = (field: any) => {
        const str = String(field || '').replace(/"/g, '""');
        return `"${str}"`;
      };
      
      return [
        escapeCsvField(doc.title),
        escapeCsvField((doc.authors || []).join(', ')),
        doc.year || 'N/A',
        escapeCsvField(doc.summary),
        escapeCsvField((doc.subjects || []).join(', ')),
        escapeCsvField((doc.riskFactors || []).join(', ')),
        escapeCsvField((doc.interventions || []).join(', ')),
        escapeCsvField((doc.keyPopulations || []).join(', ')),
        escapeCsvField(doc.pdfUrl)
      ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "evidence_project_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">My Saved List ({savedDocuments.length})</h2>
        <div className="flex items-center gap-2">
            <button 
                onClick={handleExportToCSV}
                disabled={savedDocuments.length === 0}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-accent text-white font-semibold rounded-lg shadow-sm hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-75 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <DownloadIcon />
              Download CSV
            </button>
            <button 
                onClick={onReturn}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-75 transition-colors"
            >
              &larr; Back to Search
            </button>
        </div>
      </div>

      {savedDocuments.length > 0 ? (
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg">
          {savedDocuments.map(doc => (
            <ResultCard
              key={doc.id}
              document={doc}
              isSaved={true}
              onToggleSave={() => onToggleSave(doc)}
              onCite={() => onCite(doc)}
              onFindRelated={() => onFindRelated(doc)}
              onViewPdf={() => onViewPdf(doc)}
              onAuthorClick={onAuthorClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 px-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Your List is Empty</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Click the "Add to List" button on a search result to save it here.
          </p>
        </div>
      )}
    </div>
  );
};