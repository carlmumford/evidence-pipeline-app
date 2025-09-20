import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { ResultsList } from './components/ResultsList';
import { AISuggestions } from './components/AISuggestions';
import { UploadModal } from './components/UploadModal';
import { DataVisualizations } from './components/DataVisualizations';
import { getSearchSuggestions } from './services/geminiService';
import { getDocuments, addDocument as saveDocument } from './services/documentService';
import type { Document } from './types';
import { UploadIcon, LoadingSpinner } from './constants';

const App: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDocsLoading, setIsDocsLoading] = useState<boolean>(true);
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const allDocs = await getDocuments();
        setDocuments(allDocs);
      } catch (err) {
        console.error("Failed to load documents:", err);
        setError("Could not load the evidence library. Please try refreshing the page.");
      } finally {
        setIsDocsLoading(false);
      }
    };
    loadDocuments();
  }, []);


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

    // Perform local search
    const lowerCaseQuery = query.toLowerCase();
    const filteredResults = documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(lowerCaseQuery) ||
        (doc.summary && doc.summary.toLowerCase().includes(lowerCaseQuery)) ||
        (doc.simplifiedSummary && doc.simplifiedSummary.toLowerCase().includes(lowerCaseQuery)) ||
        doc.authors.some((author) => author.toLowerCase().includes(lowerCaseQuery))
    );
    setSearchResults(filteredResults);

    // Fetch AI suggestions
    try {
      const suggestions = await getSearchSuggestions(query, documents);
      setAiSuggestions(suggestions);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch AI suggestions. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }, [documents]);

  const handleAddDocument = async (newDocument: Omit<Document, 'id' | 'createdAt'>) => {
    const docWithId = await saveDocument(newDocument);
    setDocuments((prevDocs) => [docWithId, ...prevDocs]);
  };

  if (isDocsLoading) {
    return (
        <div className="min-h-screen bg-base-200 dark:bg-dark-base-200 text-slate-800 dark:text-slate-200 font-sans">
            <Header />
            <div className="flex flex-col justify-center items-center h-[calc(100vh-100px)]">
                <LoadingSpinner className="h-12 w-12 text-brand-primary dark:text-brand-accent"/>
                <p className="mt-4 text-lg">Loading evidence library...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 dark:bg-dark-base-200 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-primary dark:text-brand-accent mb-2">Evidence Hub</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Search our repository of research on the school-to-prison pipeline.
            </p>
          </div>
          
          <div className="flex justify-center mb-8">
              <button
                  onClick={() => setIsUploadModalOpen(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg shadow-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-opacity-75 transition-transform transform hover:scale-105"
              >
                  <UploadIcon />
                  Upload Evidence
              </button>
          </div>

          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
          
          {error && <p className="text-center text-red-500 mt-4">{error}</p>}

          <div className="my-8">
            <DataVisualizations documents={documents} />
          </div>

          <div className="mt-12">
            <AISuggestions suggestions={aiSuggestions} onSuggestionClick={handleSearch} isLoading={isLoading} />
            <ResultsList results={searchResults} isLoading={isLoading} hasSearched={hasSearched} />
          </div>
        </div>
      </main>
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        onAddDocument={handleAddDocument}
      />
    </div>
  );
};

export default App;