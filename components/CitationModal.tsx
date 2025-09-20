import React, { useState, useEffect } from 'react';
import type { Document } from '../types';
import { CloseIcon, CheckCircleIcon } from '../constants';

interface CitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
}

const generateAPA = (doc: Document): string => {
    const authors = doc.authors.join(', ');
    const year = doc.year ? `(${doc.year})` : '(n.d.)';
    const title = doc.title;
    const publication = doc.publicationTitle ? `${doc.publicationTitle}.` : '';
    
    return `${authors} ${year}. ${title}. ${publication}`;
};

export const CitationModal: React.FC<CitationModalProps> = ({ isOpen, onClose, document }) => {
  const [citation, setCitation] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (document) {
      setCitation(generateAPA(document));
    }
  }, [document]);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(citation).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  if (!isOpen || !document) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="citation-modal-title"
    >
      <div
        className="bg-base-100 dark:bg-dark-base-300 rounded-lg shadow-2xl p-8 w-full max-w-lg relative mx-4"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          aria-label="Close modal"
        >
          <CloseIcon />
        </button>
        <h2 id="citation-modal-title" className="text-2xl font-bold text-brand-primary dark:text-brand-accent mb-4">Cite this Resource</h2>
        <div className="p-4 bg-base-200 dark:bg-dark-base-200 rounded-md mb-6">
            <p className="text-slate-700 dark:text-slate-300 font-mono text-sm leading-relaxed">{citation}</p>
        </div>
        <div className="flex justify-end">
            <button
                onClick={handleCopy}
                className="flex items-center justify-center px-4 py-2 text-white bg-brand-primary rounded-md hover:bg-brand-secondary transition-colors"
            >
                {isCopied ? <CheckCircleIcon className="h-5 w-5 mr-2" /> : null}
                {isCopied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
        </div>
      </div>
    </div>
  );
};
