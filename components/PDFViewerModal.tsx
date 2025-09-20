import React from 'react';
import type { Document } from '../types';
import { CloseIcon } from '../constants';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({ isOpen, onClose, document }) => {
  if (!isOpen || !document) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-viewer-title"
    >
      <div
        className="bg-base-100 dark:bg-dark-base-300 rounded-lg shadow-2xl w-[95%] h-[95%] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-base-300 dark:border-slate-700 flex-shrink-0">
          <h2 id="pdf-viewer-title" className="text-lg font-bold text-brand-primary dark:text-brand-accent truncate pr-4">
            {document.title}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            aria-label="Close PDF viewer"
          >
            <CloseIcon />
          </button>
        </header>
        <div className="flex-grow">
          {document.pdfUrl && document.pdfUrl !== '#' ? (
            <iframe
              src={document.pdfUrl}
              title={`PDF viewer for ${document.title}`}
              className="w-full h-full border-none"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
                <p className="text-slate-500">No PDF available for this document.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};