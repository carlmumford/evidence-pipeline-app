import React, { useState } from 'react';
import type { Document } from '../types';
import { BookmarkIcon, CiteIcon, DownloadIcon, ChevronDownIcon } from '../constants';

interface ResultCardProps {
  document: Document;
  isSaved: boolean;
  onToggleSave: () => void;
  onCite: () => void;
  onFindRelated: () => void;
  onViewPdf: () => void;
  onAuthorClick: (author: string) => void;
}

const IconButton: React.FC<{
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  href?: string;
  disabled?: boolean;
  children: React.ReactNode;
  'aria-label': string;
  tooltip: string;
}> = ({ onClick, href, disabled, children, 'aria-label': ariaLabel, tooltip }) => {
  const commonClasses = "p-2 rounded-md transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-100 group relative";

  const content = (
    <>
      {children}
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 group-hover:z-50 transition-opacity pointer-events-none">
        {tooltip}
      </span>
    </>
  );

  if (href && !disabled) {
    return (
      <a href={href} download target="_blank" rel="noopener noreferrer" className={commonClasses} aria-label={ariaLabel}>
        {content}
      </a>
    );
  }
  
  return (
    <button onClick={onClick} disabled={disabled} className={commonClasses} aria-label={ariaLabel}>
      {content}
    </button>
  );
};

const Tag: React.FC<{ label: string }> = ({ label }) => {
    return (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 whitespace-nowrap">
            {label}
        </span>
    );
};

export const ResultCard: React.FC<ResultCardProps> = ({ document, isSaved, onToggleSave, onCite, onFindRelated, onViewPdf, onAuthorClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const allTags = [
    ...document.subjects,
    ...document.riskFactors,
    ...document.interventions,
    ...document.keyPopulations,
  ].slice(0, 4); // Limit tags for cleaner UI

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 group">
        <div 
            className="flex items-center gap-4 p-4 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
            role="button"
            aria-expanded={isExpanded}
            aria-controls={`details-${document.id}`}
        >
            <div className="flex-grow">
                <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">{document.title}</h4>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    <span>
                        {document.authors.map((author, index) => (
                            <React.Fragment key={author}>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onAuthorClick(author); }} 
                                    className="hover:underline focus:outline-none focus:ring-1 focus:ring-accent rounded"
                                >
                                    {author}
                                </button>
                                {index < document.authors.length - 1 && ', '}
                            </React.Fragment>
                        ))}
                    </span>
                    {document.year && <span className="mx-2">&#8226;</span>}
                    {document.year && <span>{document.year}</span>}
                </div>
            </div>

            {allTags.length > 0 && (
                <div className="hidden lg:flex flex-wrap gap-2 flex-shrink-0 max-w-sm">
                    {allTags.map(tag => <Tag key={tag} label={tag} />)}
                </div>
            )}
            
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <IconButton 
                    href={document.pdfUrl} 
                    disabled={!document.pdfUrl || document.pdfUrl === '#'} 
                    aria-label={`Download PDF for ${document.title}`}
                    tooltip="Download PDF"
                >
                    <DownloadIcon className="h-4 w-4" />
                </IconButton>
                <IconButton 
                    onClick={(e) => { e.stopPropagation(); onCite(); }} 
                    aria-label={`Cite ${document.title}`}
                    tooltip="Cite"
                >
                    <CiteIcon className="h-4 w-4" />
                </IconButton>
                <IconButton 
                    onClick={(e) => { e.stopPropagation(); onToggleSave(); }} 
                    aria-label={isSaved ? `Remove ${document.title} from your list` : `Add ${document.title} to your list`}
                    tooltip={isSaved ? 'Remove from list' : 'Add to list'}
                >
                    <BookmarkIcon className={`h-4 w-4 ${isSaved ? 'text-accent' : ''}`} isSaved={isSaved} />
                </IconButton>
            </div>
            
             <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      
        {isExpanded && (
            <div id={`details-${document.id}`} className="px-4 pb-4 animate-fade-in">
                <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4 text-sm">
                        {document.simplifiedSummary || document.summary}
                    </p>
                    {document.keyStats.length > 0 && (
                        <div>
                        <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-2 text-sm">Key Statistics</h5>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            {document.keyStats.map((stat, index) => <li key={index}>{stat}</li>)}
                        </ul>
                        </div>
                    )}
                     <div className="flex items-center gap-2 mt-4">
                        <button onClick={onViewPdf} disabled={!document.pdfUrl || document.pdfUrl === '#'} className="text-sm font-medium text-accent hover:text-accent-hover disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline hover:underline">
                            View PDF
                        </button>
                         <span className="text-gray-300 dark:text-gray-600">&#8226;</span>
                        <button onClick={onFindRelated} className="text-sm font-medium text-accent hover:text-accent-hover hover:underline">
                            Find Related
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export const ResultCardSkeleton: React.FC = () => {
  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-800 animate-pulse">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    </div>
  );
}