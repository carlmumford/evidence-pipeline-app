import React from 'react';
import type { Document } from '../types';

interface ResultCardProps {
  document: Document;
}

export const ResultCard: React.FC<ResultCardProps> = ({ document }) => {
  return (
    <div className="bg-base-100 dark:bg-dark-base-300 rounded-xl shadow-md overflow-hidden p-6 border border-base-300 dark:border-slate-700 transition-all duration-300 hover:shadow-xl hover:border-brand-accent">
      <h4 className="text-xl font-bold text-brand-primary dark:text-brand-accent mb-2">{document.title}</h4>
      <div className="text-sm text-slate-500 dark:text-slate-400 mb-3">
        <span>{document.authors.join(', ')}</span>
        {document.year && <span className="mx-2">|</span>}
        {document.year && <span>{document.year}</span>}
      </div>
      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
        {document.simplifiedSummary || document.summary}
      </p>
    </div>
  );
};

export const ResultCardSkeleton: React.FC = () => {
  return (
    <div className="bg-base-100 dark:bg-dark-base-300 rounded-xl shadow-md p-6 border border-base-300 dark:border-slate-700 animate-pulse">
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
      </div>
    </div>
  );
}