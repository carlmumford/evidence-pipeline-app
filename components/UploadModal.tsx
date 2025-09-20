import React, { useState, useCallback } from 'react';
import type { Document } from '../types';
import { CloseIcon, UploadIcon, DocumentIcon } from '../constants';
import { extractInfoFromDocument, simplifySummary } from '../services/geminiService';
import { AnalyzingIndicator } from './AnalyzingIndicator';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDocument: (doc: Omit<Document, 'id' | 'createdAt'>) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onAddDocument }) => {
  // Form state
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState('');
  const [summary, setSummary] = useState('');
  const [simplifiedSummary, setSimplifiedSummary] = useState('');
  const [year, setYear] = useState('');
  const [publicationTitle, setPublicationTitle] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [subjects, setSubjects] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [interventions, setInterventions] = useState('');
  const [keyPopulations, setKeyPopulations] = useState('');
  const [riskFactors, setRiskFactors] = useState('');
  const [keyOrganisations, setKeyOrganisations] = useState('');

  // Control state
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
    setPublicationTitle('');
    setResourceType('');
    setSubjects('');
    setPdfUrl('');
    setInterventions('');
    setKeyPopulations('');
    setRiskFactors('');
    setKeyOrganisations('');
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
      setPublicationTitle(extractedData.publicationTitle || '');
      setResourceType(extractedData.resourceType || '');
      setSubjects(extractedData.subjects || '');
      setInterventions(extractedData.interventions || '');
      setKeyPopulations(extractedData.keyPopulations || '');
      setRiskFactors(extractedData.riskFactors || '');
      setKeyOrganisations(extractedData.keyOrganisations || '');
      
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
      year: year ? parseInt(year, 10) : undefined,
      publicationTitle,
      resourceType,
      subjects: subjects.split(',').map(s => s.trim()).filter(Boolean),
      interventions: interventions.split(',').map(s => s.trim()).filter(Boolean),
      keyPopulations: keyPopulations.split(',').map(s => s.trim()).filter(Boolean),
      riskFactors: riskFactors.split(',').map(s => s.trim()).filter(Boolean),
      keyOrganisations: keyOrganisations.split(',').map(s => s.trim()).filter(Boolean),
      pdfUrl,
    };
    onAddDocument(newDoc);
    handleClose();
  };

  if (!isOpen) return null;
  
  const inputClasses = "block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 shadow-sm focus:border-accent focus:ring focus:ring-accent focus:ring-opacity-50 text-sm placeholder:text-gray-400";


  const renderContent = () => {
    if (isExtracting) {
        return <AnalyzingIndicator />;
    }

    if (!isExtracted) {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <label htmlFor="dropzone-file" className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent cursor-pointer bg-gray-50 dark:bg-gray-900/50">
                        <UploadIcon className="mx-auto h-10 w-10 text-gray-400" />
                        <span className="mt-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Click to upload or drag and drop
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                            PDF, TXT, DOCX, etc.
                        </span>
                        <input id="dropzone-file" type="file" className="sr-only" onChange={handleFileChange} />
                    </label>
                </div>
            
            {file && (
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md flex items-center justify-between animate-fade-in">
                  <div className="flex items-center gap-3">
                      <DocumentIcon className="h-6 w-6 text-accent"/>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{file.name}</span>
                  </div>
                  <button onClick={() => setFile(null)} className="text-sm text-red-500 hover:underline">Remove</button>
              </div>
            )}
            
            <div className="pt-2">
              <button
                onClick={handleExtract}
                disabled={!file || isExtracting}
                className="w-full flex justify-center items-center px-6 py-3 text-white bg-accent rounded-md hover:bg-accent-hover transition-colors disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed font-semibold"
              >
                <UploadIcon className="h-5 w-5 mr-2"/>
                Extract Information with AI
              </button>
            </div>
          </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 -mr-2">
            {extractionError && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 dark:bg-red-800/50 dark:border-red-600 dark:text-red-200 rounded-md">
                <p>{extractionError}</p>
            </div>
            )}
            {file && !extractionError && (
                <div className="p-2 text-sm bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-200 rounded-md">
                    Information extracted from <strong>{file.name}</strong>. Please review and edit if needed.
                </div>
            )}
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className={inputClasses} required />
            </div>
            <div>
                <label htmlFor="authors" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Authors (comma-separated) *</label>
                <input type="text" id="authors" value={authors} onChange={e => setAuthors(e.target.value)} className={inputClasses} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                <input type="number" id="year" value={year} onChange={e => setYear(e.target.value)} className={inputClasses} />
                </div>
                <div>
                <label htmlFor="resourceType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Resource Type</label>
                <input type="text" id="resourceType" value={resourceType} onChange={e => setResourceType(e.target.value)} className={inputClasses} placeholder="e.g., Journal Article"/>
                </div>
            </div>
            <div>
                <label htmlFor="publicationTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Publication Title</label>
                <input type="text" id="publicationTitle" value={publicationTitle} onChange={e => setPublicationTitle(e.target.value)} className={inputClasses} placeholder="e.g., The Journal of Law & Equity"/>
            </div>
             <div>
                <label htmlFor="keyOrganisations" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key Organisations (comma-separated)</label>
                <input type="text" id="keyOrganisations" value={keyOrganisations} onChange={e => setKeyOrganisations(e.target.value)} className={inputClasses} placeholder="e.g., The Advancement Project"/>
            </div>
            <div>
                <label htmlFor="subjects" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subjects (comma-separated)</label>
                <input type="text" id="subjects" value={subjects} onChange={e => setSubjects(e.target.value)} className={inputClasses} placeholder="e.g., zero tolerance, restorative justice"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="riskFactors" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Risk Factors (comma-separated)</label>
                    <input type="text" id="riskFactors" value={riskFactors} onChange={e => setRiskFactors(e.target.value)} className={inputClasses} placeholder="e.g., poverty, exclusion rates"/>
                </div>
                 <div>
                    <label htmlFor="keyPopulations" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key Populations (comma-separated)</label>
                    <input type="text" id="keyPopulations" value={keyPopulations} onChange={e => setKeyPopulations(e.target.value)} className={inputClasses} placeholder="e.g., students of colour"/>
                </div>
            </div>
            <div>
                <label htmlFor="interventions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interventions (comma-separated)</label>
                <input type="text" id="interventions" value={interventions} onChange={e => setInterventions(e.target.value)} className={inputClasses} placeholder="e.g., policy reform"/>
            </div>
            <div>
                <label htmlFor="pdfUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PDF URL</label>
                <input type="url" id="pdfUrl" value={pdfUrl} onChange={e => setPdfUrl(e.target.value)} className={inputClasses} placeholder="https://example.com/document.pdf"/>
            </div>
            <div>
                <label htmlFor="summary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Summary / Abstract *</label>
                <textarea id="summary" rows={4} value={summary} onChange={e => setSummary(e.target.value)} className={inputClasses} required></textarea>
            </div>
            <div className="flex justify-between items-center pt-4 sticky bottom-0 bg-white dark:bg-gray-800 py-4 -mx-2 px-2">
                <button type="button" onClick={() => { setIsExtracted(false); setFile(null); resetForm(); }} className="px-4 py-2 text-sm text-accent hover:underline font-medium">Upload another</button>
                <div>
                    <button type="button" onClick={handleClose} className="px-4 py-2 mr-2 text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-semibold">Cancel</button>
                    <button type="submit" className="px-6 py-2 text-white bg-accent rounded-md hover:bg-accent-hover transition-colors font-semibold">Add Document</button>
                </div>
            </div>
      </form>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center animate-fade-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-2xl relative mx-4"
        onClick={e => e.stopPropagation()}
      >
        <button 
          onClick={handleClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Close modal"
        >
          <CloseIcon />
        </button>
        <h2 id="upload-modal-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Upload New Evidence</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">For security, please only upload publicly available research. Do not upload documents containing sensitive or personally identifiable information.</p>
        {renderContent()}
      </div>
    </div>
  );
};