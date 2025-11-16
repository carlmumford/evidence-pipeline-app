import React, { useState } from 'react';
import type { Document } from '../types';
import { BookmarkIcon, CiteIcon, DownloadIcon, ChevronDownIcon, ClipboardIcon, CheckCircleIcon } from '../constants';

const StrengthOfEvidenceTag: React.FC<{ level?: string }> = ({ level }) => {
    if (!level) return null;

    const levelLower = level.toLowerCase();
    let colorClasses = 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'; // Default for grey literature

    if (levelLower.includes('systematic review') || levelLower.includes('meta-analysis')) {
        colorClasses = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    } else if (levelLower.includes('randomised controlled trial') || levelLower.includes('rct')) {
        colorClasses = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    } else if (levelLower.includes('observational') || levelLower.includes('cohort')) {
        colorClasses = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    } else if (levelLower.includes('qualitative')) {
        colorClasses = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    }

    return (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${colorClasses}`}>
            {level}
        </span>
    );
};

const SummarySection: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => {
    if (!children) return null;
    return (
        <div>
            <h5 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{title}</h5>
            {typeof children === 'string' && children.includes(';') ? (
                 <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {children.split(';').map((item, index) => item.trim() && <li key={index}>{item.trim()}</li>)}
                </ul>
            ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{children}</p>
            )}
        </div>
    );
};

const StructuredSummary: React.FC<{ document: Document }> = ({ document }) => {
    const hasStructuredData = document.aim || document.population || document.methods || document.keyFindings || document.implications;

    if (!hasStructuredData) {
        return (
             <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">
                {document.simplifiedSummary || document.summary}
            </p>
        );
    }
    
    return (
        <div className="space-y-4">
            <SummarySection title="Aim">{document.aim}</SummarySection>
            <SummarySection title="Population">{document.population}{document.sampleSize && ` (Sample size: ${document.sampleSize})`}</SummarySection>
            <SummarySection title="Methods">{document.methods}</SummarySection>
            <SummarySection title="Key Findings">{document.keyFindings}</SummarySection>
            <SummarySection title="Implications for Practice">{document.implications}</SummarySection>
        </div>
    );
};


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
  const commonClasses = "px-3 py-2 rounded-md transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-100 group relative";

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

export const ResultCard: React.FC<ResultCardProps> = ({ document, isSaved, onToggleSave, onCite, onFindRelated, onViewPdf, onAuthorClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopySummary = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const summaryText = `
        Title: ${document.title}\n
        Authors: ${document.authors.join(', ')}\n
        Year: ${document.year || 'N/A'}\n
        Aim: ${document.aim || 'N/A'}\n
        Population: ${document.population || 'N/A'}\n
        Sample Size: ${document.sampleSize || 'N/A'}\n
        Methods: ${document.methods || 'N/A'}\n
        Key Findings: ${document.keyFindings?.replace(/;/g, '\n- ') || 'N/A'}\n
        Implications: ${document.implications || 'N/A'}
    `.trim().replace(/^\s+/gm, '');
    
    navigator.clipboard.writeText(summaryText).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

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
                <div className="flex items-center gap-3 mb-1">
                    <StrengthOfEvidenceTag level={document.strengthOfEvidence} />
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">{document.title}</h4>
                </div>
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
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    <div className="mb-4">
                        <StructuredSummary document={document} />
                    </div>
                    
                     <div className="flex items-center gap-4">
                        <button onClick={onViewPdf} disabled={!document.pdfUrl || document.pdfUrl === '#'} className="text-sm font-medium text-accent hover:text-accent-hover disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline hover:underline">
                            View PDF
                        </button>
                         <span className="text-gray-300 dark:text-gray-600">&#8226;</span>
                        <button onClick={onFindRelated} className="text-sm font-medium text-accent hover:text-accent-hover hover:underline">
                            Find Related
                        </button>
                        <span className="text-gray-300 dark:text-gray-600">&#8226;</span>
                         <button onClick={handleCopySummary} className="flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover hover:underline">
                           {isCopied ? <CheckCircleIcon className="h-4 w-4 text-green-500" /> : <ClipboardIcon className="h-4 w-4" />}
                           {isCopied ? 'Copied!' : 'Copy Summary'}
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