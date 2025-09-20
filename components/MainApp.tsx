import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { SearchBar } from './SearchBar';
import { ResultsList } from './ResultsList';
import { AISuggestions } from './AISuggestions';
import { UploadModal } from './UploadModal';
import { DataVisualizations } from './DataVisualizations';
import { RefineResultsPanel } from './RefineResultsPanel';
import { CitationModal } from './CitationModal';
import { SavedList } from './SavedList';
import { getSearchSuggestions } from '../services/geminiService';
import { getDocuments, addDocument as saveDocument } from '../services/documentService';
import { listService } from '../services/listService';
import type { Document } from '../types';
import { UploadIcon, LoadingSpinner, CheckCircleIcon, CloseIcon, ListIcon } from '../constants';

const RESULTS_PER_PAGE = 5;

const MainApp: React.FC = () => {
  // Core Data State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDocsLoading, setIsDocsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & UI State
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  
  // View State
  const [view, setView] = useState<'search' | 'list'>('search');

  // Saved List State
  const [savedDocIds, setSavedDocIds] = useState<string[]>(listService.getSavedIds());

  // Filtering State
  const [filters, setFilters] = useState({
      startYear: '',
      endYear: '',
      resourceTypes: [] as string[],
      subjects: [] as string[],
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Citation Modal State
  const [citationModalDoc, setCitationModalDoc] = useState<Document | null>(null);

  // Fetch all documents on initial load
  const fetchDocuments = useCallback(async () => {
    try {
      const allDocs = await getDocuments();
      setDocuments(allDocs);
    } catch (err) {
      console.error("Failed to load documents:", err);
      setError("Could not load the evidence library. Please try refreshing the page.");
    } finally {
      setIsDocsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);
  
  // Memoized derived data for performance
  const savedDocuments = useMemo(() => {
    return documents.filter(doc => savedDocIds.includes(doc.id));
  }, [documents, savedDocIds]);

  const filteredResults = useMemo(() => {
    return searchResults.filter(doc => {
      const { startYear, endYear, resourceTypes, subjects } = filters;
      const docYear = doc.year || 0;
      const start = startYear ? parseInt(startYear, 10) : 0;
      const end = endYear ? parseInt(endYear, 10) : Infinity;

      const yearMatch = start && end ? docYear >= start && docYear <= end :
                        start ? docYear >= start :
                        end ? docYear <= end : true;
      
      const resourceTypeMatch = resourceTypes.length === 0 || (doc.resourceType && resourceTypes.includes(doc.resourceType));
      const subjectMatch = subjects.length === 0 || (doc.subjects && subjects.some(s => doc.subjects?.includes(s)));

      return yearMatch && resourceTypeMatch && subjectMatch;
    });
  }, [searchResults, filters]);
  
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
    return filteredResults.slice(startIndex, startIndex + RESULTS_PER_PAGE);
  }, [filteredResults, currentPage]);
  
  const filterOptions = useMemo(() => {
      const resourceTypes = [...new Set(searchResults.map(d => d.resourceType).filter(Boolean) as string[])];
      const subjects = [...new Set(searchResults.flatMap(d => d.subjects).filter(Boolean) as string[])];
      return { resourceTypes, subjects };
  }, [searchResults]);

  // Handlers
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setAiSuggestions([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setAiSuggestions([]);
    setCurrentPage(1); // Reset to first page on new search
    setFilters({ startYear: '', endYear: '', resourceTypes: [], subjects: [] }); // Reset filters
    setView('search');

    const lowerCaseQuery = query.toLowerCase();
    const filtered = documents.filter(doc =>
      doc.title.toLowerCase().includes(lowerCaseQuery) ||
      (doc.summary && doc.summary.toLowerCase().includes(lowerCaseQuery)) ||
      (doc.simplifiedSummary && doc.simplifiedSummary.toLowerCase().includes(lowerCaseQuery)) ||
      doc.authors.some(author => author.toLowerCase().includes(lowerCaseQuery))
    );
    setSearchResults(filtered);

    try {
      const suggestions = await getSearchSuggestions(query, documents);
      setAiSuggestions(suggestions);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch AI suggestions.');
    } finally {
      setIsLoading(false);
    }
  }, [documents]);

  const handleAddDocument = async (newDocument: Omit<Document, 'id' | 'createdAt'>) => {
    try {
      await saveDocument(newDocument);
      await fetchDocuments(); 
      setConfirmationMessage(`"${newDocument.title}" was successfully added.`);
      setTimeout(() => setConfirmationMessage(null), 5000);
    } catch (err) {
      console.error("Failed to add document:", err);
      setError("Could not add the new document.");
    }
  };
  
  const handleToggleSave = (doc: Document) => {
    const newSavedIds = listService.toggleSaved(doc.id);
    setSavedDocIds(newSavedIds);
  };
  
  useEffect(() => {
    // Reset page to 1 if filters change and make the current page invalid
    if (currentPage > 1 && paginatedResults.length === 0) {
        setCurrentPage(1);
    }
  }, [filters, currentPage, paginatedResults]);

  if (isDocsLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
        <LoadingSpinner className="h-12 w-12 text-brand-primary dark:text-brand-accent" />
        <p className="mt-4 text-lg">Loading evidence library...</p>
      </div>
    );
  }

  const renderContent = () => {
    if (view === 'list') {
        return (
            <SavedList
                savedDocuments={savedDocuments}
                onToggleSave={handleToggleSave}
                onCite={setCitationModalDoc}
                onReturn={() => setView('search')}
            />
        );
    }
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className={`lg:col-span-3 ${hasSearched ? 'block' : 'hidden'} lg:block`}>
          <RefineResultsPanel
            options={filterOptions}
            filters={filters}
            onFilterChange={setFilters}
            disabled={!hasSearched || searchResults.length === 0}
          />
        </aside>

        <div className="lg:col-span-9">
          <AISuggestions suggestions={aiSuggestions} onSuggestionClick={handleSearch} isLoading={isLoading} />
          <ResultsList
            results={paginatedResults}
            isLoading={isLoading}
            hasSearched={hasSearched}
            savedDocIds={savedDocIds}
            onToggleSave={handleToggleSave}
            onCite={setCitationModalDoc}
            currentPage={currentPage}
            totalResults={filteredResults.length}
            resultsPerPage={RESULTS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      {confirmationMessage && (
        <div className="fixed top-24 right-4 md:right-8 bg-green-100 border border-green-400 text-green-700 dark:bg-green-800/50 dark:border-green-600 dark:text-green-200 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center max-w-md animate-fade-in" role="alert">
          <CheckCircleIcon className="h-6 w-6 text-green-500 dark:text-green-400 mr-3 shrink-0" />
          <div className="flex-grow">
            <strong className="font-bold">Success!</strong>
            <span className="block text-sm">{confirmationMessage}</span>
          </div>
          <button onClick={() => setConfirmationMessage(null)} className="ml-4 -mr-1 p-1 rounded-full hover:bg-green-200 dark:hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400" aria-label="Close">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-brand-primary dark:text-brand-accent mb-2">Evidence Hub</h2>
          <p className="text-lg text-slate-600 dark:text-slate-400">Search our repository of research on the school-to-prison pipeline.</p>
        </div>

        <div className="flex justify-center items-center gap-4 mb-8">
          <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg shadow-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-opacity-75 transition-transform transform hover:scale-105">
            <UploadIcon />
            Upload Evidence
          </button>
          <button onClick={() => setView('list')} className="flex items-center gap-2 px-6 py-3 bg-base-100 dark:bg-dark-base-300 text-slate-700 dark:text-slate-200 font-semibold rounded-lg shadow-md hover:bg-base-200 dark:hover:bg-dark-base-100 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-opacity-75 transition-transform transform hover:scale-105">
            <ListIcon />
            My List ({savedDocIds.length})
          </button>
        </div>

        <div className="max-w-4xl mx-auto">
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        </div>
        
        {error && <p className="text-center text-red-500 mt-4">{error}</p>}
        
        {view === 'search' && (
          <>
            <div className="my-8">
              <DataVisualizations documents={documents} />
            </div>
            <div className="mt-12">
              {renderContent()}
            </div>
          </>
        )}
      </div>

       {view === 'list' && (
         <div className="mt-12 max-w-4xl mx-auto">
            {renderContent()}
         </div>
       )}

      <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onAddDocument={handleAddDocument} />
      <CitationModal document={citationModalDoc} isOpen={!!citationModalDoc} onClose={() => setCitationModalDoc(null)} />
    </>
  );
};

export default MainApp;
