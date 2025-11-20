import React, { useState } from 'react';
import type { Document } from '../types';
import { ResultCard } from './ResultCard';
import { DownloadIcon, SparklesIcon, LoadingSpinner, TrashIcon } from '../constants';
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
  const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set());

  const toggleSelectDoc = (id: string) => {
      const newSelected = new Set(selectedDocs);
      if (newSelected.has(id)) {
          newSelected.delete(id);
      } else {
          newSelected.add(id);
      }
      setSelectedDocs(newSelected);
  };

  const toggleSelectAll = () => {
      if (selectedDocs.size === savedDocuments.length) {
          setSelectedDocs(new Set());
      } else {
          setSelectedDocs(new Set(savedDocuments.map(d => d.id)));
      }
  };

  const handleExport = (format: 'csv' | 'ris' | 'bibtex') => {
    const docsToExport = selectedDocs.size > 0 
        ? savedDocuments.filter(d => selectedDocs.has(d.id))
        : savedDocuments;

    if (docsToExport.length === 0) return;

    let content = '';
    let mimeType = 'text/plain';
    let extension = 'txt';

    if (format === 'csv') {
        const headers = ["Title", "Authors", "Year", "Summary", "Subjects", "Risk Factors", "Interventions", "Key Populations", "URL"];
        const rows = docsToExport.map(doc => {
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
        content = [headers.join(','), ...rows].join('\n');
        mimeType = 'text/csv';
        extension = 'csv';
    } else if (format === 'ris') {
        content = docsToExport.map(doc => {
            const lines = ['TY  - JOUR'];
            doc.authors.forEach(author => lines.push(`AU  - ${author}`));
            lines.push(`PY  - ${doc.year || ''}`);
            lines.push(`TI  - ${doc.title}`);
            if (doc.publicationTitle) lines.push(`JO  - ${doc.publicationTitle}`);
            if (doc.summary) lines.push(`AB  - ${doc.summary}`);
            lines.push('ER  - ');
            return lines.join('\n');
        }).join('\n\n');
        mimeType = 'application/x-research-info-systems';
        extension = 'ris';
    } else if (format === 'bibtex') {
        content = docsToExport.map(doc => {
            const lastName = doc.authors[0]?.split(' ').pop() || 'Unknown';
            const year = doc.year || 'nodate';
            const firstWord = doc.title.split(' ')[0]?.replace(/[^a-zA-Z0-9]/g, '') || 'Untitled';
            const key = `${lastName}${year}${firstWord}`;
            return `@article{${key},\n  author = {${doc.authors.join(' and ')}},\n  title = {${doc.title}},\n  year = {${doc.year || 'n.d.'}},\n  journal = {${doc.publicationTitle || 'N/A'}}\n}`;
        }).join('\n\n');
        mimeType = 'application/x-bibtex';
        extension = 'bib';
    }

    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `evidence_export.${extension}`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const handleBulkDelete = () => {
      if (confirm(`Are you sure you want to remove ${selectedDocs.size} items from your list?`)) {
          // Iterate and remove. In a real app, pass a bulk handler to props.
          const docsToRemove = savedDocuments.filter(d => selectedDocs.has(d.id));
          docsToRemove.forEach(d => onToggleSave(d));
          setSelectedDocs(new Set());
      }
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

      <div className="mb-6 flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2 mr-4 border-r border-gray-200 dark:border-gray-700 pr-4">
                <input 
                    type="checkbox" 
                    checked={savedDocuments.length > 0 && selectedDocs.size === savedDocuments.length}
                    onChange={toggleSelectAll}
                    disabled={savedDocuments.length === 0}
                    className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                    id="select-all"
                />
                <label htmlFor="select-all" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">Select All</label>
            </div>

            <button 
                onClick={handleAnalyzeList}
                disabled={savedDocuments.length === 0 || isAnalyzing}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-md shadow-sm hover:shadow hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isAnalyzing ? <LoadingSpinner className="text-white h-4 w-4" /> : <SparklesIcon className="h-4 w-4 text-yellow-300" />}
                {isAnalyzing ? "Analyzing..." : "Analyze List"}
            </button>

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

            <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:inline">Export:</span>
                <button onClick={() => handleExport('csv')} disabled={savedDocuments.length === 0} className="text-sm text-gray-600 dark:text-gray-300 hover:text-accent font-medium px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">CSV</button>
                <button onClick={() => handleExport('ris')} disabled={savedDocuments.length === 0} className="text-sm text-gray-600 dark:text-gray-300 hover:text-accent font-medium px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">RIS</button>
                <button onClick={() => handleExport('bibtex')} disabled={savedDocuments.length === 0} className="text-sm text-gray-600 dark:text-gray-300 hover:text-accent font-medium px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">BibTeX</button>
            </div>

             {selectedDocs.size > 0 && (
                <button 
                    onClick={handleBulkDelete}
                    className="ml-auto flex items-center gap-1 px-3 py-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-300 border border-red-100 dark:border-red-800 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                    <TrashIcon className="h-4 w-4"/>
                    <span>Delete ({selectedDocs.size})</span>
                </button>
            )}
      </div>

      {analysis && (
        <div className="mb-8 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-100 dark:border-purple-800/50 rounded-xl animate-fade-in shadow-sm">
            <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100 mb-4 flex items-center gap-2 border-b border-purple-200 dark:border-purple-800 pb-2">
                <SparklesIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                AI Research Insights
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
              selected={selectedDocs.has(doc.id)}
              onSelect={() => toggleSelectDoc(doc.id)}
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