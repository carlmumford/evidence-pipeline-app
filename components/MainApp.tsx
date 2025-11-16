import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getDocuments, addDocument } from '../services/documentService';
import { getSearchSuggestions, performAISearch } from '../services/geminiService';
import { listService } from '../services/listService';
import type { Document, Filters } from '../types';
import { SearchBar } from './SearchBar';
import { RefineResultsPanel } from './RefineResultsPanel';
import { ResultsList } from './ResultsList';
import { AISuggestions } from './AISuggestions';
import { UploadModal } from './UploadModal';
import { CitationModal } from './CitationModal';
import { PDFViewerModal } from './PDFViewerModal';
import { SavedList } from './SavedList';
import { DataPage } from './DataPage';
import { LoadingSpinner } from '../constants';

const MainApp: React.FC = () => {
  // Data state
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [view, setView] = useState<'search' | 'list' | 'data'>('search');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [citationDoc, setCitationDoc] = useState<Document | null>(null);
  const [pdfDoc, setPdfDoc] = useState<Document | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    startYear: '',
    endYear: '',
    resourceTypes: [],
    subjects: [],
    interventions: [],
    keyPopulations: [],
    riskFactors: [],
    keyOrganisations: [],
    mentalHealthConditions: [],
  });
  const [isAiSearching, setIsAiSearching] = useState(false);

  // AI Suggestions State
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Saved List State
  const [savedDocIds, setSavedDocIds] = useState<string[]>(listService.getSavedIds());
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const RESULTS_PER_PAGE = 10;

  // Initial data fetch
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const docs = await getDocuments();
        setAllDocuments(docs);
        setFilteredDocuments(docs); // Initially, all documents are shown
      } catch (err) {
        setError('Failed to load documents. Please try refreshing the page.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  // Debounced AI suggestions fetch
  useEffect(() => {
    if (searchQuery.length < 3) {
      setAiSuggestions([]);
      return;
    }

    const handler = setTimeout(() => {
      const fetchSuggestions = async () => {
        setIsSuggesting(true);
        try {
          const suggestions = await getSearchSuggestions(searchQuery, allDocuments);
          setAiSuggestions(suggestions);
        } catch (error) {
          console.error("Failed to get AI suggestions:", error);
          setAiSuggestions([]);
        } finally {
          setIsSuggesting(false);
        }
      };
      fetchSuggestions();
    }, 500); // 500ms debounce

    return () => clearTimeout(handler);
  }, [searchQuery, allDocuments]);
  
  // AI-powered search logic
  const performSearch = useCallback(async () => {
    setIsAiSearching(true);
    setError(null);

    try {
        const matchingIds = await performAISearch(searchQuery, filters, allDocuments);
        
        // The AI returns IDs. We need to find the full documents and preserve the AI's ranking.
        const idToDocMap = new Map(allDocuments.map(doc => [doc.id, doc]));
        const aiFilteredDocs = matchingIds.map(id => idToDocMap.get(id)).filter((doc): doc is Document => !!doc);
        
        setFilteredDocuments(aiFilteredDocs);
        setCurrentPage(1);
    } catch (err) {
        setError("AI search failed. Please try again or refine your query.");
        setFilteredDocuments([]);
        console.error(err);
    } finally {
        setIsAiSearching(false);
    }
  }, [searchQuery, filters, allDocuments]);


  // Effect to trigger AI search on query or filter change
  useEffect(() => {
    if (hasSearched && !isLoading) {
      const handler = setTimeout(() => {
        performSearch();
      }, 500); // Debounce to avoid rapid firing on typing or multiple filter clicks
      return () => clearTimeout(handler);
    }
  }, [searchQuery, filters, hasSearched, isLoading, performSearch]);


  // Event Handlers
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setHasSearched(true);
    setView('search');
  };
  
  const handleAddDocument = async (newDocData: Omit<Document, 'id' | 'createdAt'>) => {
    try {
        const newDoc = await addDocument(newDocData);
        setAllDocuments(prevDocs => [newDoc, ...prevDocs]);
    } catch (error) {
        console.error("Failed to add document:", error);
        alert("There was an error saving your document. Please try again.");
    }
  };

  const handleToggleSave = (doc: Document) => {
    const newSavedIds = listService.toggleSaved(doc.id);
    setSavedDocIds(newSavedIds);
  };
  
  // Memoized values for performance
  const filterOptions = useMemo(() => {
    const getUniqueValues = (key: keyof Document) => {
        const allValues = allDocuments.flatMap(doc => doc[key] || []);
        return [...new Set(allValues.filter(Boolean))].sort() as string[];
    };
    return {
        resourceTypes: getUniqueValues('resourceType'),
        subjects: getUniqueValues('subjects'),
        interventions: getUniqueValues('interventions'),
        keyPopulations: getUniqueValues('keyPopulations'),
        riskFactors: getUniqueValues('riskFactors'),
        keyOrganisations: getUniqueValues('keyOrganisations'),
        mentalHealthConditions: getUniqueValues('mentalHealthConditions'),
    };
  }, [allDocuments]);

  const savedDocuments = useMemo(() => {
    return allDocuments.filter(doc => savedDocIds.includes(doc.id));
  }, [allDocuments, savedDocIds]);

  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
    return filteredDocuments.slice(startIndex, startIndex + RESULTS_PER_PAGE);
  }, [filteredDocuments, currentPage]);


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner className="h-10 w-10 text-gray-400" />
      </div>
    );
  }

  if (error && !isAiSearching) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }
  
  const renderMainContent = () => {
    switch (view) {
        case 'list':
            return <SavedList 
                savedDocuments={savedDocuments}
                onToggleSave={handleToggleSave}
                onCite={setCitationDoc}
                onReturn={() => setView('search')}
                onFindRelated={(doc) => handleSearch((doc.subjects).join(' '))}
                onViewPdf={setPdfDoc}
                onAuthorClick={(author) => handleSearch(author)}
            />;
        case 'data':
            return <DataPage 
                documents={allDocuments}
                onSearch={handleSearch}
                onReturn={() => setView('search')}
            />;
        case 'search':
        default:
            return (
                <div className="p-4 md:p-6">
                    <div className="max-w-3xl mx-auto">
                        <SearchBar 
                            onSearch={handleSearch} 
                            isLoading={isSuggesting || isAiSearching}
                            initialQuery={searchQuery}
                        />
                        <AISuggestions 
                            suggestions={aiSuggestions}
                            onSuggestionClick={handleSearch}
                            isLoading={isSuggesting}
                        />
                         {error && isAiSearching && <div className="text-center py-4 text-red-500">{error}</div>}
                    </div>
                    <ResultsList
                        results={paginatedResults}
                        isLoading={isAiSearching}
                        hasSearched={hasSearched}
                        savedDocIds={savedDocIds}
                        onToggleSave={handleToggleSave}
                        onCite={setCitationDoc}
                        onFindRelated={(doc) => handleSearch((doc.subjects).join(' '))}
                        onViewPdf={setPdfDoc}
                        onAuthorClick={(author) => handleSearch(author)}
                        currentPage={currentPage}
                        totalResults={filteredDocuments.length}
                        resultsPerPage={RESULTS_PER_PAGE}
                        onPageChange={setCurrentPage}
                    />
                </div>
            );
    }
  };

  return (
    <div className="lg:flex">
      <aside className="hidden lg:block lg:w-1/4 xl:w-1/5 h-[calc(100vh-4rem)] sticky top-16 flex-shrink-0 bg-gray-50 dark:bg-gray-900/50 border-r border-gray-200 dark:border-gray-800">
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
      <main className="w-full flex-grow lg:h-[calc(100vh-4rem)] lg:overflow-y-auto">
        {renderMainContent()}
      </main>

      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        onAddDocument={handleAddDocument}
      />
      <CitationModal 
        isOpen={!!citationDoc} 
        onClose={() => setCitationDoc(null)} 
        document={citationDoc} 
      />
      <PDFViewerModal 
        isOpen={!!pdfDoc}
        onClose={() => setPdfDoc(null)}
        document={pdfDoc}
      />
    </div>
  );
};

export default MainApp;
