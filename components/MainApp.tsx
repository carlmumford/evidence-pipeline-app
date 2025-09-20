import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { SearchBar } from './SearchBar';
import { ResultsList } from './ResultsList';
import { AISuggestions } from './AISuggestions';
import { UploadModal } from './UploadModal';
import { DataPage } from './DataPage';
import { RefineResultsPanel } from './RefineResultsPanel';
import { CitationModal } from './CitationModal';
import { SavedList } from './SavedList';
import { PDFViewerModal } from './PDFViewerModal';
import { getSearchSuggestions } from '../services/geminiService';
import { getDocuments, addDocument as saveDocument } from '../services/documentService';
import { listService } from '../services/listService';
import type { Document } from '../types';
import { UploadIcon, LoadingSpinner, CheckCircleIcon, CloseIcon, ListIcon, ChartBarIcon } from '../constants';

const RESULTS_PER_PAGE = 5;

const MainApp: React.FC = () => {
  // Core Data State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDocsLoading, setIsDocsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  
  // View State
  const [view, setView] = useState<'search' | 'list' | 'data'>('search');

  // Saved List State
  const [savedDocIds, setSavedDocIds] = useState<string[]>(listService.getSavedIds());

  // Filtering State
  const [filters, setFilters] = useState({
      startYear: '',
      endYear: '',
      resourceTypes: [] as string[],
      subjects: [] as string[],
      interventions: [] as string[],
      keyPopulations: [] as string[],
      riskFactors: [] as string[],
      keyOrganizations: [] as string[],
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [citationModalDoc, setCitationModalDoc] = useState<Document | null>(null);
  const [pdfToView, setPdfToView] = useState<Document | null>(null);

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
      const { startYear, endYear, resourceTypes, subjects, interventions, keyPopulations, riskFactors, keyOrganizations } = filters;
      const docYear = doc.year || 0;
      const start = startYear ? parseInt(startYear, 10) : 0;
      const end = endYear ? parseInt(endYear, 10) : Infinity;

      const yearMatch = start && end ? docYear >= start && docYear <= end :
                        start ? docYear >= start :
                        end ? docYear <= end : true;
      
      const resourceTypeMatch = resourceTypes.length === 0 || (doc.resourceType && resourceTypes.includes(doc.resourceType));
      const subjectMatch = subjects.length === 0 || (doc.subjects && subjects.some(s => doc.subjects?.includes(s)));
      const interventionMatch = interventions.length === 0 || (doc.interventions && interventions.some(i => doc.interventions?.includes(i)));
      const populationMatch = keyPopulations.length === 0 || (doc.keyPopulations && keyPopulations.some(p => doc.keyPopulations?.includes(p)));
      const riskFactorMatch = riskFactors.length === 0 || (doc.riskFactors && riskFactors.some(r => doc.riskFactors?.includes(r)));
      const organizationMatch = keyOrganizations.length === 0 || (doc.keyOrganizations && keyOrganizations.some(o => doc.keyOrganizations?.includes(o)));

      return yearMatch && resourceTypeMatch && subjectMatch && interventionMatch && populationMatch && riskFactorMatch && organizationMatch;
    });
  }, [searchResults, filters]);
  
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
    return filteredResults.slice(startIndex, startIndex + RESULTS_PER_PAGE);
  }, [filteredResults, currentPage]);
  
  const filterOptions = useMemo(() => {
      const resourceTypes = [...new Set(searchResults.map(d => d.resourceType).filter(Boolean) as string[])];
      const subjects = [...new Set(searchResults.flatMap(d => d.subjects).filter(Boolean) as string[])];
      const interventions = [...new Set(searchResults.flatMap(d => d.interventions).filter(Boolean) as string[])];
      const keyPopulations = [...new Set(searchResults.flatMap(d => d.keyPopulations).filter(Boolean) as string[])];
      const riskFactors = [...new Set(searchResults.flatMap(d => d.riskFactors).filter(Boolean) as string[])];
      const keyOrganizations = [...new Set(searchResults.flatMap(d => d.keyOrganizations).filter(Boolean) as string[])];
      return { resourceTypes, subjects, interventions, keyPopulations, riskFactors, keyOrganizations };
  }, [searchResults]);

  const performSearch = useCallback((query: string, searchDocuments: Document[]) => {
    const lowerCaseQuery = query.toLowerCase();
    return searchDocuments.filter(doc =>
      doc.title.toLowerCase().includes(lowerCaseQuery) ||
      (doc.summary && doc.summary.toLowerCase().includes(lowerCaseQuery)) ||
      (doc.simplifiedSummary && doc.simplifiedSummary.toLowerCase().includes(lowerCaseQuery)) ||
      doc.authors.some(author => author.toLowerCase().includes(lowerCaseQuery)) ||
      doc.subjects?.some(s => s.toLowerCase().includes(lowerCaseQuery)) ||
      doc.interventions?.some(i => i.toLowerCase().includes(lowerCaseQuery)) ||
      doc.keyPopulations?.some(p => p.toLowerCase().includes(lowerCaseQuery)) ||
      doc.riskFactors?.some(r => r.toLowerCase().includes(lowerCaseQuery)) ||
      doc.keyOrganizations?.some(o => o.toLowerCase().includes(lowerCaseQuery))
    );
  }, []);

  // Handlers
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    setView('search');

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
    setCurrentPage(1); 
    setFilters({ startYear: '', endYear: '', resourceTypes: [], subjects: [], interventions: [], keyPopulations: [], riskFactors: [], keyOrganizations: [] }); 

    const filtered = performSearch(query, documents);
    setSearchResults(filtered);

    try {
      if (query.length > 3) {
        const suggestions = await getSearchSuggestions(query, documents);
        setAiSuggestions(suggestions);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch AI suggestions.');
    } finally {
      setIsLoading(false);
    }
  }, [documents, performSearch]);
  
  const handleFindRelated = (doc: Document) => {
    const queryParts = [
        ...(doc.subjects || []),
        ...(doc.riskFactors || []),
    ];
    const query = queryParts.slice(0, 2).join(' ');
    
    if (!query) {
        handleSearch(doc.title);
        return;
    }
    
    handleSearch(query);
  };
  
  const handleAuthorSearch = (author: string) => {
      handleSearch(`"${author}"`);
  };

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
    if (currentPage > 1 && paginatedResults.length === 0 && filteredResults.length > 0) {
        setCurrentPage(1);
    }
  }, [filters, currentPage, paginatedResults, filteredResults]);

  if (isDocsLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
        <LoadingSpinner className="h-12 w-12 text-brand-primary dark:text-brand-accent" />
        <p className="mt-4 text-lg">Loading evidence library...</p>
      </div>
    );
  }

  const renderCurrentView = () => {
    switch(view) {
        case 'list':
            return (
                 <div className="mt-12 max-w-4xl mx-auto">
                    <SavedList
                        savedDocuments={savedDocuments}
                        onToggleSave={handleToggleSave}
                        onCite={setCitationModalDoc}
                        onReturn={() => setView('search')}
                        onFindRelated={handleFindRelated}
                        onViewPdf={setPdfToView}
                        onAuthorClick={handleAuthorSearch}
                    />
                </div>
            );
        case 'data':
            return (
                <div className="mt-12 max-w-6xl mx-auto">
                    <DataPage
                        documents={documents}
                        onSearch={handleSearch}
                        onReturn={() => setView('search')}
                    />
                </div>
            );
        case 'search':
        default:
             return (
                <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
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
                        onFindRelated={handleFindRelated}
                        onViewPdf={setPdfToView}
                        onAuthorClick={handleAuthorSearch}
                        currentPage={currentPage}
                        totalResults={filteredResults.length}
                        resultsPerPage={RESULTS_PER_PAGE}
                        onPageChange={setCurrentPage}
                    />
                    </div>
                </div>
            );
    }
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
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tighter mb-4">Evidence Hub</h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">Search our AI-powered repository of research on the school-to-prison pipeline.</p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-4 mb-12">
          <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 dark:focus:ring-offset-dark-base-300 transition-transform transform hover:scale-105">
            <UploadIcon />
            Upload Evidence
          </button>
           <button onClick={() => setView('data')} className="flex items-center gap-2 px-6 py-3 bg-base-100 dark:bg-dark-base-200 text-slate-700 dark:text-slate-200 font-semibold rounded-lg shadow-md hover:bg-base-200 dark:hover:bg-dark-base-100 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 dark:focus:ring-offset-dark-base-300 transition-transform transform hover:scale-105">
            <ChartBarIcon />
            Data & Insights
          </button>
          <button onClick={() => setView('list')} className="flex items-center gap-2 px-6 py-3 bg-base-100 dark:bg-dark-base-200 text-slate-700 dark:text-slate-200 font-semibold rounded-lg shadow-md hover:bg-base-200 dark:hover:bg-dark-base-100 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 dark:focus:ring-offset-dark-base-300 transition-transform transform hover:scale-105">
            <ListIcon />
            My List ({savedDocIds.length})
          </button>
        </div>

        {view === 'search' && (
            <div className="max-w-4xl mx-auto">
                <SearchBar onSearch={handleSearch} isLoading={isLoading} initialQuery={searchQuery} />
            </div>
        )}
        
        {error && <p className="text-center text-red-500 mt-4">{error}</p>}
        
        {renderCurrentView()}
      </div>

      <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onAddDocument={handleAddDocument} />
      <CitationModal document={citationModalDoc} isOpen={!!citationModalDoc} onClose={() => setCitationModalDoc(null)} />
      <PDFViewerModal document={pdfToView} isOpen={!!pdfToView} onClose={() => setPdfToView(null)} />
    </>
  );
};

export default MainApp;