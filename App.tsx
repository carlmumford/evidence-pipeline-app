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
import { UploadIcon, LoadingSpinner, CheckCircleIcon, CloseIcon } from './constants';

const App: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDocsLoading, setIsDocsLoading] = useState<boolean>(true);
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);

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
    try {
      const docWithId = await saveDocument(newDocument);
      setDocuments((prevDocs) => [docWithId, ...prevDocs]);
      setConfirmationMessage(`"${docWithId.title}" was successfully added.`);
      setTimeout(() => setConfirmationMessage(null), 5000); // Auto-hide after 5 seconds
    } catch (err) {
      console.error("Failed to add document:", err);
      setError("Could not add the new document. Please try again later.");
    }
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
      {confirmationMessage && (
        <div 
            className="fixed top-24 right-4 md:right-8 bg-green-100 border border-green-400 text-green-700 dark:bg-green-800/50 dark:border-green-600 dark:text-green-200 px-4 py-3 rounded-lg shadow-lg z-50 flex items-center max-w-md animate-fade-in" 
            role="alert"
            aria-live="polite"
        >
            <CheckCircleIcon className="h-6 w-6 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" />
            <div className="flex-grow">
                <strong className="font-bold">Success!</strong>
                <span className="block text-sm">{confirmationMessage}</span>
            </div>
            <button 
                onClick={() => setConfirmationMessage(null)} 
                className="ml-4 -mr-1 p-1 rounded-full hover:bg-green-200 dark:hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
                aria-label="Close notification"
            >
                <CloseIcon className="h-5 w-5" />
            </button>
        </div>
      )}

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