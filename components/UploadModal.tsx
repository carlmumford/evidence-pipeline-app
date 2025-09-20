import React, { useState, useCallback } from 'react';
import type { Document } from '../types';
import { CloseIcon, UploadIcon, DocumentIcon, LoadingSpinner } from '../constants';
import { extractInfoFromDocument, simplifySummary } from '../services/geminiService';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDocument: (doc: Omit<Document, 'id'>) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onAddDocument }) => {
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [summary, setSummary] = useState('');
  const [simplifiedSummary, setSimplifiedSummary] = useState('');
  const [year, setYear] = useState('');

  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [isExtracted, setIsExtracted] = useState(false);

  const resetForm = useCallback(() => {
    setTitle('');
    setAuthors('');
    setSummary('');
    setSimplifiedSummary('');
    setYear('');
    setFile(null);
    setIsExtracting(false);
    setExtractionError(null);
    setIsExtracted(false);
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        setIsExtracted(false);
        setExtractionError(null);
        setFile(selectedFile);
    }
  };

  const fileToBase64 = (file: File): Promise<{ mimeType: string, data: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(',')[1];
        resolve({ mimeType: file.type, data: base64Data });
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleExtract = async () => {
    if (!file) return;

    setIsExtracting(true);
    setExtractionError(null);
    try {
      const fileData = await fileToBase64(file);
      const extractedData = await extractInfoFromDocument(fileData);

      setTitle(extractedData.title || '');
      setAuthors(extractedData.authors || '');
      const originalSummary = extractedData.summary || '';
      setSummary(originalSummary);
      setYear(extractedData.year ? String(extractedData.year) : '');
      
      if (originalSummary) {
          const simpleSummary = await simplifySummary(originalSummary);
          setSimplifiedSummary(simpleSummary);
      }
      
      setIsExtracted(true);
    } catch (err) {
      setExtractionError('Failed to extract information. Please check the file or fill the form manually.');
      setIsExtracted(true);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !authors || !summary) {
      alert('Please fill in all required fields.');
      return;
    }
    const newDoc = {
      title,
      authors: authors.split(',').map(a => a.trim()),
      summary,
      simplifiedSummary: simplifiedSummary || summary,
      year: year ? parseInt(year, 10) : undefined
    };
    onAddDocument(newDoc);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div 
        className="bg-base-100 dark:bg-dark-base-300 rounded-lg shadow-2xl p-8 w-full max-w-lg relative mx-4"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          aria-label="Close modal"
        >
          <CloseIcon />
        </button>
        <h2 id="upload-modal-title" className="text-2xl font-bold text-brand-primary dark:text-brand-accent mb-6">Upload New Evidence</h2>

        {!isExtracted ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-base-300 dark:border-slate-600 border-dashed rounded-lg cursor-pointer bg-base-200 dark:bg-dark-base-200 hover:bg-base-300 dark:hover:bg-dark-base-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadIcon className="w-10 h-10 mb-3 text-slate-400" />
                  <p className="mb-2 text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">PDF, TXT, DOCX, etc.</p>
                </div>
                <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
            
            {file && (
              <div className="p-3 bg-base-200 dark:bg-dark-base-200 rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <DocumentIcon className="h-8 w-8 text-brand-primary dark:text-brand-accent"/>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{file.name}</span>
                  </div>
                  <button onClick={() => setFile(null)} className="text-sm text-red-500 hover:underline">Remove</button>
              </div>
            )}
            
            <div className="flex justify-end pt-2">
              <button
                onClick={handleExtract}
                disabled={!file || isExtracting}
                className="w-full flex justify-center items-center px-6 py-3 text-white bg-brand-primary rounded-md hover:bg-brand-secondary transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                {isExtracting ? <LoadingSpinner/> : <UploadIcon className="h-5 w-5 mr-2"/>}
                {isExtracting ? 'Analyzing Document...' : 'Extract Information with AI'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {extractionError && (
              <div className="p-3 bg-red-100 border border-red-400 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300 rounded-md">
                <p>{extractionError}</p>
              </div>
            )}
            {file && !extractionError && (
                <div className="p-2 text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-md">
                    Information extracted from <strong>{file.name}</strong>. Please review and edit if needed.
                </div>
            )}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title *</label>
              <input 
                type="text" 
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-base-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent bg-base-200 dark:bg-dark-base-100"
                required
              />
            </div>
            <div>
              <label htmlFor="authors" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Authors (comma-separated) *</label>
              <input 
                type="text" 
                id="authors"
                value={authors}
                onChange={e => setAuthors(e.target.value)}
                className="w-full px-3 py-2 border border-base-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent bg-base-200 dark:bg-dark-base-100"
                required
              />
            </div>
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Year</label>
              <input 
                type="number" 
                id="year"
                value={year}
                onChange={e => setYear(e.target.value)}
                className="w-full px-3 py-2 border border-base-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent bg-base-200 dark:bg-dark-base-100"
              />
            </div>
            <div>
              <label htmlFor="summary" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Summary / Abstract *</label>
              <textarea 
                id="summary"
                rows={4}
                value={summary}
                onChange={e => setSummary(e.target.value)}
                className="w-full px-3 py-2 border border-base-300 dark:border-slate-600 rounded-md shadow-sm focus:ring-brand-accent focus:border-brand-accent bg-base-200 dark:bg-dark-base-100"
                required
              ></textarea>
            </div>
            <div className="flex justify-between items-center pt-4">
                <button type="button" onClick={() => { setIsExtracted(false); setFile(null); resetForm(); }} className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:underline">Upload another file</button>
                <div>
                    <button type="button" onClick={handleClose} className="px-4 py-2 mr-2 text-slate-700 dark:text-slate-300 bg-base-200 dark:bg-dark-base-100 rounded-md hover:bg-base-300 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-2 text-white bg-brand-primary rounded-md hover:bg-brand-secondary transition-colors">Add Document</button>
                </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};