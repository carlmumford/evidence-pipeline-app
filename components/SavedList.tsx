import React from 'react';
import type { Document } from '../types';
import { ResultCard } from './ResultCard';
import { DownloadIcon } from '../constants';

interface SavedListProps {
  savedDocuments: Document[];
  onToggleSave: (doc: Document) => void;
  onCite: (doc: Document) => void;
  onReturn: () => void;
}

export const SavedList: React.FC<SavedListProps> = ({ savedDocuments, onToggleSave, onCite, onReturn }) => {
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
        escapeCsvField(doc.authors.join(', ')),
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-300">My Saved List ({savedDocuments.length})</h2>
        <div className="flex items-center gap-2">
            <button 
                onClick={handleExportToCSV}
                disabled={savedDocuments.length === 0}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-opacity-75 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              <DownloadIcon />
              Download CSV
            </button>
            <button 
                onClick={onReturn}
                className="px-4 py-2 text-sm bg-base-200 dark:bg-dark-base-100 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-base-300 dark:hover:bg-dark-base-200 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-opacity-75 transition-colors"
            >
              &larr; Back to Search
            </button>
        </div>
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
              onFindRelated={() => { /* Not available on this page, but prop is required */ }}
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
