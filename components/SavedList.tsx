
import React, { useState } from 'react';
import type { Document } from '../types';
import { ResultCard } from './ResultCard';
import { DownloadIcon, SparklesIcon, LoadingSpinner } from '../constants';
import { analyzeSavedCollection } from '../services/geminiService';

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
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
        escapeCsvField(doc.subjects.join(', ')),
        escapeCsvField(doc.riskFactors.join(', ')),
        escapeCsvField(doc.interventions.join(', ')),
        escapeCsvField(doc.keyPopulations.join(', ')),
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
  
  const handleAnalyzeList = async () => {
    if (savedDocuments.length === 0) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
        const result = await analyzeSavedCollection(savedDocuments);
        setAnalysis(result);
    } catch (e) {
        console.error(e);
        setAnalysis("Failed to analyze the collection.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">My Saved List ({savedDocuments.length})</h2>
        <div className="flex items-center gap-2">
            <button 
                onClick={onReturn}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-75 transition-colors"
            >
              &larr; Back to Search
            </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
            <button 
                onClick={handleAnalyzeList}
                disabled={savedDocuments.length === 0 || isAnalyzing}
                className="flex items-center gap-2 px-4 py-2.5 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isAnalyzing ? <LoadingSpinner className="text-white" /> : <SparklesIcon className="h-5 w-5 text-yellow-300" />}
                {isAnalyzing ? "Analyzing..." : "Analyze Collection with AI"}
            </button>

            <button 
                onClick={handleExportToCSV}
                disabled={savedDocuments.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 font-semibold rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <DownloadIcon />
              Download CSV
            </button>
      </div>

      {analysis && (
        <div className="mb-8 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-100 dark:border-purple-800/50 rounded-xl animate-fade-in">
            <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
                <SparklesIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Collection Insights
            </h3>
            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-medium leading-relaxed">
                {analysis}
            </div>
        </div>
      )}

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
            Click the bookmark icon on a search result to save it here.
          </p>
        </div>
      )}
    </div>
  );
};
