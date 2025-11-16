import React, { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';
import { getDocuments, addDocument } from '../services/documentService';
import { getSearchSuggestions, normalizeFilterTerms } from '../services/geminiService';
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
import { FilterIcon } from '../constants';
import { FilterPills } from './FilterPills';


const MainApp: React.FC = () => {
  // Data state
  const [allDocuments, setAllDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [termMappings, setTermMappings] = useState<Record<string, Record<string, string>> | null>(null);

  // UI State
  const [view, setView] = useState<'search' | 'list' | 'data'>('search');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [citationDoc, setCitationDoc] = useState<Document | null>(null);
  const [pdfDoc, setPdfDoc] = useState<Document | null>(null);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
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

  // AI Suggestions State
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);

  // Saved List State
  const [savedDocIds, setSavedDocIds] = useState<string[]>(listService.getSavedIds());
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const RESULTS_PER_PAGE = 10;

  // STEP 1: Fetch critical data (documents) immediately to unblock UI.
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const docs = await getDocuments();
        setAllDocuments(docs);
      } catch (err) {
        setError('Failed to load documents. Please try refreshing the page.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocs();
  }, []);
  
  // STEP 2: Once documents are loaded, run non-blocking AI normalization in the background.
  useEffect(() => {
    if (allDocuments.length === 0) return;

    const normalizeTermsInBackground = async () => {
        const categoriesToNormalize: Record<string, string[]> = {
            resourceTypes: [], subjects: [], interventions: [], keyPopulations: [],
            riskFactors: [], keyOrganisations: [], mentalHealthConditions: [],
        };
        
        const tempUniqueValues: Record<string, Set<string>> = {};

        allDocuments.forEach(doc => {
            Object.keys(categoriesToNormalize).forEach(key => {
                if (!tempUniqueValues[key]) tempUniqueValues[key] = new Set();
                const value = doc[key as keyof Document];
                const values = Array.isArray(value) ? value : (typeof value === 'string' ? [value] : []);
                values.forEach(v => v && tempUniqueValues[key].add(v));
            });
        });
        
        Object.keys(tempUniqueValues).forEach(key => {
            categoriesToNormalize[key] = Array.from(tempUniqueValues[key]);
        });
        
        const mappings = await normalizeFilterTerms(categoriesToNormalize);
        setTermMappings(mappings);

        // After getting mappings, translate any currently active filters to their canonical form.
        setFilters(currentFilters => {
            const newFilters = { ...currentFilters };
            Object.keys(mappings).forEach(category => {
                const categoryMapping = mappings[category as keyof typeof mappings];
                const oldFilterValues = currentFilters[category as keyof Filters] as string[];
                
                if (Array.isArray(oldFilterValues) && oldFilterValues.length > 0 && categoryMapping) {
                    const newCanonicalValues = new Set(
                        oldFilterValues
                            .map(oldValue => categoryMapping[oldValue.toLowerCase()])
                            .filter(Boolean)
                    );
                    (newFilters[category as keyof Filters] as string[]) = Array.from(newCanonicalValues);
                }
            });
            return newFilters;
        });
    };

    normalizeTermsInBackground();
  }, [allDocuments]);

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

  const fuse = useMemo(() => {
    const options = {
        keys: [
            'title', 
            'authors', 
            'summary', 
            'subjects', 
            'riskFactors', 
            'interventions', 
            'keyPopulations',
            'publicationTitle',
            'keyOrganisations',
            'mentalHealthConditions'
        ],
        includeScore: true,
        threshold: 0.4,
        ignoreLocation: true,
    };
    return new Fuse(allDocuments, options);
  }, [allDocuments]);

  useEffect(() => {
    if (isLoading) return;

    let results: Document[] = [];

    if (searchQuery.trim()) {
        results = fuse.search(searchQuery).map(result => result.item);
    } else {
        results = [...allDocuments];
    }
    
    const hasActiveFilters = 
        filters.startYear ||
        filters.endYear ||
        Object.values(filters).some(value => Array.isArray(value) && value.length > 0);

    if (hasActiveFilters) {
        results = results.filter(doc => {
            if (filters.startYear && doc.year && doc.year < parseInt(filters.startYear, 10)) return false;
            if (filters.endYear && doc.year && doc.year > parseInt(filters.endYear, 10)) return false;
            
            const checkArrayFilter = (docField: string[] | string | undefined, filterField: string[], category: keyof Filters) => {
                if (filterField.length === 0) return true;
                const docValues = Array.isArray(docField) ? docField : (docField ? [docField] : []);

                // If mappings are ready, use them for robust filtering.
                if (termMappings) {
                    const mappingsForCategory = termMappings[category];
                    if (!mappingsForCategory) return true; // Fail open if mappings don't exist

                    const canonicalDocTerms = new Set(
                        docValues.map(term => mappingsForCategory[term.toLowerCase().trim()]).filter(Boolean)
                    );
                    return filterField.every(filterItem => canonicalDocTerms.has(filterItem));
                } 
                // Before mappings are ready, perform a simple, direct match.
                else {
                    const docTerms = new Set(docValues);
                    return filterField.every(filterItem => docTerms.has(filterItem));
                }
            };

            if (!checkArrayFilter(doc.resourceType, filters.resourceTypes, 'resourceTypes')) return false;
            if (!checkArrayFilter(doc.subjects, filters.subjects, 'subjects')) return false;
            if (!checkArrayFilter(doc.interventions, filters.interventions, 'interventions')) return false;
            if (!checkArrayFilter(doc.keyPopulations, filters.keyPopulations, 'keyPopulations')) return false;
            if (!checkArrayFilter(doc.riskFactors, filters.riskFactors, 'riskFactors')) return false;
            if (!checkArrayFilter(doc.keyOrganisations, filters.keyOrganisations, 'keyOrganisations')) return false;
            if (!checkArrayFilter(doc.mentalHealthConditions, filters.mentalHealthConditions, 'mentalHealthConditions')) return false;

            return true;
        });
    }

    if (!searchQuery.trim()) {
        results.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    }

    setFilteredDocuments(results);
    setCurrentPage(1);
  }, [searchQuery, filters, allDocuments, fuse, isLoading, termMappings]);
  
  // Event Handlers
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setView('search');
    setIsFilterPanelOpen(false);
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

  const handleRemoveFilter = (category: keyof Filters, valueToRemove: string) => {
    setFilters(prevFilters => {
        const newFilters = { ...prevFilters };
        if (category === 'startYear' || category === 'endYear') {
            newFilters.startYear = '';
            newFilters.endYear = '';
        } else {
            const currentValues = prevFilters[category] as string[];
            (newFilters[category] as string[]) = currentValues.filter(v => v !== valueToRemove);
        }
        return newFilters;
    });
  };

  const handleClearFilters = () => {
    setFilters({
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
  };
  
  // Memoized values for performance
  const filterOptions = useMemo(() => {
    const getRawUniqueValues = (key: keyof Document) => {
        const valueSet = new Set<string>();
        allDocuments.forEach(doc => {
            const value = doc[key];
            const values = Array.isArray(value) ? value : (typeof value === 'string' ? [value] : []);
            values.forEach(v => v && valueSet.add(v));
        });
        return Array.from(valueSet).sort((a, b) => a.localeCompare(b));
    };

    // Before AI normalization is done, show the raw, un-grouped filter options.
    if (!termMappings) {
        return {
            resourceTypes: getRawUniqueValues('resourceType'),
            subjects: getRawUniqueValues('subjects'),
            interventions: getRawUniqueValues('interventions'),
            keyPopulations: getRawUniqueValues('keyPopulations'),
            riskFactors: getRawUniqueValues('riskFactors'),
            keyOrganisations: getRawUniqueValues('keyOrganisations'),
            mentalHealthConditions: getRawUniqueValues('mentalHealthConditions'),
        };
    }

    // After AI normalization, show the clean, canonical filter options.
    const getCanonicalValues = (category: keyof typeof termMappings) => {
        const mappingsForCategory = termMappings[category];
        if (!mappingsForCategory) return [];
        const canonicalValues = new Set(Object.values(mappingsForCategory));
        return Array.from(canonicalValues).sort((a: string, b: string) => a.localeCompare(b));
    };

    return {
        resourceTypes: getCanonicalValues('resourceTypes'),
        subjects: getCanonicalValues('subjects'),
        interventions: getCanonicalValues('interventions'),
        keyPopulations: getCanonicalValues('keyPopulations'),
        riskFactors: getCanonicalValues('riskFactors'),
        keyOrganisations: getCanonicalValues('keyOrganisations'),
        mentalHealthConditions: getCanonicalValues('mentalHealthConditions'),
    };
  }, [allDocuments, termMappings]);

  const savedDocuments = useMemo(() => {
    return allDocuments.filter(doc => savedDocIds.includes(doc.id));
  }, [allDocuments, savedDocIds]);

  const paginatedResults = useMemo(() => {
    const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
    return filteredDocuments.slice(startIndex, startIndex + RESULTS_PER_PAGE);
  }, [filteredDocuments, currentPage]);

  if (error) {
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
                <>
                    <div className="p-4 md:px-6 md:py-4 sticky top-16 bg-white dark:bg-gray-900 z-20 border-b border-gray-200 dark:border-gray-800">
                        <div className="flex gap-4 items-center">
                            <SearchBar 
                                onQueryChange={setSearchQuery}
                                query={searchQuery} 
                                isLoading={isSuggesting}
                            />
                            <button 
                                onClick={() => setIsFilterPanelOpen(true)}
                                className="lg:hidden flex-shrink-0 flex items-center gap-2 px-3 py-3 bg-gray-100 dark:bg-gray-800 rounded-md text-sm font-medium"
                                aria-label="Open filters"
                            >
                                <FilterIcon />
                            </button>
                        </div>
                    </div>

                    <FilterPills filters={filters} onRemoveFilter={handleRemoveFilter} onClearAll={handleClearFilters} />
                    
                    {searchQuery.length > 2 && (
                        <div className="p-4 md:px-6">
                            <AISuggestions 
                                suggestions={aiSuggestions}
                                onSuggestionClick={handleSearch}
                                isLoading={isSuggesting}
                            />
                        </div>
                    )}

                    <ResultsList
                        results={paginatedResults}
                        isLoading={isLoading}
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
                </>
            );
    }
  };

  return (
    <div className="lg:flex">
      {/* Mobile filter panel overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 z-30 lg:hidden ${isFilterPanelOpen ? 'block' : 'hidden'}`}
        onClick={() => setIsFilterPanelOpen(false)}
        aria-hidden="true"
      />
      <aside className={`fixed top-0 left-0 w-full max-w-sm h-full z-40 transform transition-transform duration-300 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:translate-x-0 lg:max-w-none lg:w-72 xl:w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 ${isFilterPanelOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <RefineResultsPanel 
            documents={allDocuments}
            options={filterOptions}
            filters={filters}
            onFilterChange={setFilters}
            onSetView={setView}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            savedDocCount={savedDocIds.length}
            currentView={view}
            onClose={() => setIsFilterPanelOpen(false)}
            termMappings={termMappings}
        />
      </aside>
      
      <main className="w-full flex-grow">
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
