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
      pdfUrl,
    };
    onAddDocument(newDoc);
    handleClose();
  };

  if (!isOpen) return null;

  const renderContent = () => {
    if (isExtracting) {
        return <AnalyzingIndicator duration={35} />;
    }

    if (!isExtracted) {
        return (
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
                <UploadIcon className="h-5 w-5 mr-2"/>
                Extract Information with AI
              </button>
            </div>
          </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
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
                <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} className="input-style" required />
            </div>
            <div>
                <label htmlFor="authors" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Authors (comma-separated) *</label>
                <input type="text" id="authors" value={authors} onChange={e => setAuthors(e.target.value)} className="input-style" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                <label htmlFor="year" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Year</label>
                <input type="number" id="year" value={year} onChange={e => setYear(e.target.value)} className="input-style" />
                </div>
                <div>
                <label htmlFor="resourceType" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Resource Type</label>
                <input type="text" id="resourceType" value={resourceType} onChange={e => setResourceType(e.target.value)} className="input-style" placeholder="e.g., Journal Article"/>
                </div>
            </div>
            <div>
                <label htmlFor="publicationTitle" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Publication Title</label>
                <input type="text" id="publicationTitle" value={publicationTitle} onChange={e => setPublicationTitle(e.target.value)} className="input-style" placeholder="e.g., The Journal of Law & Equity"/>
            </div>
            <div>
                <label htmlFor="subjects" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subjects (comma-separated)</label>
                <input type="text" id="subjects" value={subjects} onChange={e => setSubjects(e.target.value)} className="input-style" placeholder="e.g., zero tolerance, restorative justice"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="riskFactors" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Risk Factors (comma-separated)</label>
                    <input type="text" id="riskFactors" value={riskFactors} onChange={e => setRiskFactors(e.target.value)} className="input-style" placeholder="e.g., poverty, exclusion rates"/>
                </div>
                 <div>
                    <label htmlFor="keyPopulations" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Key Populations (comma-separated)</label>
                    <input type="text" id="keyPopulations" value={keyPopulations} onChange={e => setKeyPopulations(e.target.value)} className="input-style" placeholder="e.g., students of color"/>
                </div>
            </div>
            <div>
                <label htmlFor="interventions" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Interventions (comma-separated)</label>
                <input type="text" id="interventions" value={interventions} onChange={e => setInterventions(e.target.value)} className="input-style" placeholder="e.g., policy reform"/>
            </div>
            <div>
                <label htmlFor="pdfUrl" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">PDF URL</label>
                <input type="url" id="pdfUrl" value={pdfUrl} onChange={e => setPdfUrl(e.target.value)} className="input-style" placeholder="https://example.com/document.pdf"/>
            </div>
            <div>
                <label htmlFor="summary" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Summary / Abstract *</label>
                <textarea id="summary" rows={4} value={summary} onChange={e => setSummary(e.target.value)} className="input-style" required></textarea>
            </div>
            <div className="flex justify-between items-center pt-4 sticky bottom-0 bg-base-100 dark:bg-dark-base-300 py-4 -mx-2 px-2">
                <button type="button" onClick={() => { setIsExtracted(false); setFile(null); resetForm(); }} className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:underline">Upload another</button>
                <div>
                    <button type="button" onClick={handleClose} className="px-4 py-2 mr-2 text-slate-700 dark:text-slate-300 bg-base-200 dark:bg-dark-base-100 rounded-md hover:bg-base-300 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                    <button type="submit" className="px-6 py-2 text-white bg-brand-primary rounded-md hover:bg-brand-secondary transition-colors">Add Document</button>
                </div>
            </div>
      </form>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <div 
        className="bg-base-100 dark:bg-dark-base-300 rounded-lg shadow-2xl p-8 w-full max-w-2xl relative mx-4"
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
        <p className="text-sm text-slate-500 dark:text-slate-400 -mt-4 mb-6">For security, please only upload publicly available research. Do not upload documents containing sensitive or personally identifiable information.</p>
        {renderContent()}
        <style>{`.input-style { display: block; width: 100%; border-radius: 0.375rem; border: 1px solid #E0E0E0; padding: 0.5rem 0.75rem; background-color: #F5F5F5; } .dark .input-style { background-color: #1E1E1E; border-color: #2C2C2C; }`}</style>
      </div>
    </div>
  );
};
