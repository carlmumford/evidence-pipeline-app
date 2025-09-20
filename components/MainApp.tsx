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
import { LoadingSpinner, CheckCircleIcon, CloseIcon, ExclamationTriangleIcon } from '../constants';

const RESULTS_PER_PAGE = 10;

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
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
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
      keyOrganisations: [] as string[],
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
      const { startYear, endYear, resourceTypes, subjects, interventions, keyPopulations, riskFactors, keyOrganisations } = filters;
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
      const organisationMatch = keyOrganisations.length === 0 || (doc.keyOrganisations && keyOrganisations.some(o => doc.keyOrganisations?.includes(o)));

      return yearMatch && resourceTypeMatch && subjectMatch && interventionMatch && populationMatch && riskFactorMatch && organisationMatch;
    });
  }, [searchResults, filters]);
  
  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
    return filteredResults.slice(startIndex, startIndex + RESULTS_PER_PAGE);
  }, [filteredResults, currentPage]);
  
  const filterOptions = useMemo(() => {
      const resourceTypes = [...new Set(documents.map(d => d.resourceType).filter(Boolean) as string[])];
      const subjects = [...new Set(documents.flatMap(d => d.subjects).filter(Boolean) as string[])];
      const interventions = [...new Set(documents.flatMap(d => d.interventions).filter(Boolean) as string[])];
      const keyPopulations = [...new Set(documents.flatMap(d => d.keyPopulations).filter(Boolean) as string[])];
      const riskFactors = [...new Set(documents.flatMap(d => d.riskFactors).filter(Boolean) as string[])];
      const keyOrganisations = [...new Set(documents.flatMap(d => d.keyOrganisations).filter(Boolean) as string[])];
      return { resourceTypes, subjects, interventions, keyPopulations, riskFactors, keyOrganisations };
  }, [documents]);

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
      doc.keyOrganisations?.some(o => o.toLowerCase().includes(lowerCaseQuery))
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
    // Do not reset filters on search to allow iterative searching
    // setFilters({ startYear: '', endYear: '', resourceTypes: [], subjects: [], interventions: [], keyPopulations: [], riskFactors: [], keyOrganisations: [] }); 

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
    // Duplicate check
    const isDuplicate = documents.some(doc => doc.title.trim().toLowerCase() === newDocument.title.trim().toLowerCase());
    if (isDuplicate) {
        setNotification({ type: 'error', message: `A document with the title "${newDocument.title}" already exists.` });
        setTimeout(() => setNotification(null), 5000);
        return;
    }
    
    try {
      await saveDocument(newDocument);
      await fetchDocuments(); 
      setNotification({type: 'success', message: `"${newDocument.title}" was successfully added.`});
      setTimeout(() => setNotification(null), 5000);
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
  
  useEffect(() => {
    // If there is no search query, show all documents by default, otherwise show search results
    if (!searchQuery.trim()) {
        setSearchResults(documents);
    }
  }, [documents, searchQuery]);


  if (isDocsLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)]">
        <LoadingSpinner className="h-10 w-10 text-gray-400" />
      </div>
    );
  }

  const renderCurrentView = () => {
    switch(view) {
        case 'list':
            return (
                 <div className="w-full">
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
                <div className="w-full">
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
                <div className="w-full">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                        <SearchBar onSearch={handleSearch} isLoading={isLoading} initialQuery={searchQuery} />
                    </div>
                    
                    {searchQuery && <AISuggestions suggestions={aiSuggestions} onSuggestionClick={handleSearch} isLoading={isLoading} />}
                    
                    <ResultsList
                        results={paginatedResults}
                        isLoading={isLoading}
                        hasSearched={hasSearched || !!searchQuery}
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
            );
    }
  };

  const notificationStyles = {
    success: {
        container: "bg-green-100 border-green-400 text-green-700 dark:bg-green-800/50 dark:border-green-600 dark:text-green-200",
        icon: "text-green-500 dark:text-green-400",
        button: "hover:bg-green-200 dark:hover:bg-green-700 focus:ring-green-400",
    },
    error: {
        container: "bg-red-100 border-red-400 text-red-700 dark:bg-red-800/50 dark:border-red-600 dark:text-red-200",
        icon: "text-red-500 dark:text-red-400",
        button: "hover:bg-red-200 dark:hover:bg-red-700 focus:ring-red-400",
    }
  }

  return (
    <>
      {notification && (
        <div className={`fixed top-20 right-4 md:right-8 border px-4 py-3 rounded-lg shadow-lg z-50 flex items-center max-w-md animate-fade-in ${notificationStyles[notification.type].container}`} role="alert">
          {notification.type === 'success' ? <CheckCircleIcon className={`h-6 w-6 mr-3 shrink-0 ${notificationStyles.success.icon}`} /> : <ExclamationTriangleIcon className={`h-6 w-6 mr-3 shrink-0 ${notificationStyles.error.icon}`} />}
          <div className="flex-grow">
            <strong className="font-bold">{notification.type === 'success' ? 'Success!' : 'Error'}</strong>
            <span className="block text-sm">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className={`ml-4 -mr-1 p-1 rounded-full focus:outline-none focus:ring-2 ${notificationStyles[notification.type].button}`} aria-label="Close">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="flex">
        <aside className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 h-[calc(100vh-4rem)] sticky top-16">
            <RefineResultsPanel
                options={filterOptions}
                filters={filters}
                onFilterChange={setFilters}
                onSetView={setView}
                onOpenUpload={() => setIsUploadModalOpen(true)}
                savedDocCount={savedDocIds.length}
                currentView={view}
            />
        </aside>

        <div className="flex-grow min-w-0">
             {error && <p className="text-center text-red-500 p-4">{error}</p>}
             {renderCurrentView()}
        </div>
      </div>

      <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onAddDocument={handleAddDocument} />
      <CitationModal document={citationModalDoc} isOpen={!!citationModalDoc} onClose={() => setCitationModalDoc(null)} />
      <PDFViewerModal document={pdfToView} isOpen={!!pdfToView} onClose={() => setPdfToView(null)} />
    </>
  );
};

export default MainApp;