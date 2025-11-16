import React, { useState, useEffect } from 'react';
import type { Document } from '../types';
import { CloseIcon, CheckCircleIcon } from '../constants';

interface CitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
}

type CitationFormat = 'APA' | 'BibTeX' | 'RIS';

const generateAPA = (doc: Document): string => {
    const authors = doc.authors.join(', ');
    const year = doc.year ? `(${doc.year})` : '(n.d.)';
    const title = doc.title;
    const publication = doc.publicationTitle ? `${doc.publicationTitle}.` : '';
    
    return `${authors} ${year}. ${title}. ${publication}`;
};

const generateBibTeX = (doc: Document): string => {
    const lastName = doc.authors[0]?.split(' ').pop() || 'Unknown';
    const year = doc.year || 'nodate';
    const firstWord = doc.title.split(' ')[0] || 'Untitled';
    const key = `${lastName}${year}${firstWord}`.replace(/[^a-zA-Z0-9]/g, '');

    const fields = [
        `  author = {${doc.authors.join(' and ')}}`,
        `  title = {${doc.title}}`,
        `  journal = {${doc.publicationTitle || 'N/A'}}`,
        `  year = {${doc.year || 'n.d.'}}`,
    ];
    return `@article{${key},\n${fields.join(',\n')}\n}`;
};

const generateRIS = (doc: Document): string => {
    const lines = ['TY  - JOUR'];
    doc.authors.forEach(author => lines.push(`AU  - ${author}`));
    lines.push(`PY  - ${doc.year || 'n.d.'}`);
    lines.push(`TI  - ${doc.title}`);
    if (doc.publicationTitle) lines.push(`JO  - ${doc.publicationTitle}`);
    if (doc.summary) lines.push(`AB  - ${doc.summary}`);
    if (doc.pdfUrl) lines.push(`UR  - ${doc.pdfUrl}`);
    lines.push('ER  - ');
    return lines.join('\n');
};

const formatters: Record<CitationFormat, (doc: Document) => string> = {
    APA: generateAPA,
    BibTeX: generateBibTeX,
    RIS: generateRIS,
};

export const CitationModal: React.FC<CitationModalProps> = ({ isOpen, onClose, document }) => {
  const [citation, setCitation] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [format, setFormat] = useState<CitationFormat>('APA');

  useEffect(() => {
    if (document) {
      setCitation(formatters[format](document));
      setIsCopied(false);
    }
  }, [document, format]);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(citation).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  if (!isOpen || !document) return null;
  
  const FormatButton: React.FC<{ fmt: CitationFormat }> = ({ fmt }) => (
    <button
        onClick={() => setFormat(fmt)}
        className={`px-3 py-1 text-sm font-medium rounded-md ${format === fmt ? 'bg-accent text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
    >
        {fmt}
    </button>
  );

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="citation-modal-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-lg relative mx-4"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Close modal"
        >
          <CloseIcon />
        </button>
        <h2 id="citation-modal-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Cite this Resource</h2>
        
        <div className="flex items-center gap-2 mb-4">
            <FormatButton fmt="APA" />
            <FormatButton fmt="BibTeX" />
            <FormatButton fmt="RIS" />
        </div>

        <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-md mb-6 min-h-[120px]">
            <pre className="text-gray-700 dark:text-gray-300 font-mono text-sm leading-relaxed whitespace-pre-wrap">{citation}</pre>
        </div>
        <div className="flex justify-end">
            <button
                onClick={handleCopy}
                className="flex items-center justify-center px-4 py-2 text-white bg-accent rounded-md hover:bg-accent-hover transition-colors font-semibold w-40"
            >
                {isCopied ? <CheckCircleIcon className="h-5 w-5 mr-2" /> : null}
                {isCopied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
        </div>
      </div>
    </div>
  );
};