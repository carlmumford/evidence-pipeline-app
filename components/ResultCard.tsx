import React, { useState } from 'react';
import type { Document } from '../types';
import { BookmarkIcon, CiteIcon, DownloadIcon, LinkIcon, ChevronDownIcon, EyeIcon } from '../constants';

interface ResultCardProps {
  document: Document;
  isSaved: boolean;
  onToggleSave: () => void;
  onCite: () => void;
  onFindRelated: () => void;
  onViewPdf: () => void;
  onAuthorClick: (author: string) => void;
}

const ActionButton: React.FC<{
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  children: React.ReactNode;
  'aria-label': string;
  isPrimary?: boolean;
}> = ({ onClick, href, disabled, children, 'aria-label': ariaLabel, isPrimary = false }) => {
  const commonClasses = "flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const primaryClasses = "bg-brand-primary text-white hover:bg-brand-secondary";
  const secondaryClasses = "bg-base-200 dark:bg-dark-base-100 hover:bg-base-300 dark:hover:bg-dark-base-200 text-slate-700 dark:text-slate-200";

  const enabledClasses = isPrimary ? primaryClasses : secondaryClasses;

  if (href && !disabled) {
    return (
      <a href={href} download target="_blank" rel="noopener noreferrer" className={`${commonClasses} ${enabledClasses}`} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }
  
  return (
    <button onClick={onClick} disabled={disabled} className={`${commonClasses} ${disabled ? '' : enabledClasses}`} aria-label={ariaLabel}>
      {children}
    </button>
  );
};

const Tag: React.FC<{ label: string; color: 'blue' | 'green' | 'purple' | 'yellow' }> = ({ label, color }) => {
    const colorClasses = {
        blue: 'bg-blue-500/10 text-blue-400',
        green: 'bg-green-500/10 text-green-400',
        purple: 'bg-purple-500/10 text-purple-400',
        yellow: 'bg-yellow-500/10 text-yellow-400',
    };
    return (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${colorClasses[color]}`}>
            {label}
        </span>
    );
};

export const ResultCard: React.FC<ResultCardProps> = ({ document, isSaved, onToggleSave, onCite, onFindRelated, onViewPdf, onAuthorClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const allTags = [
    ...(document.riskFactors?.map(rf => ({ label: rf, color: 'purple' as const, type: 'Risk Factor' })) || []),
    ...(document.interventions?.map(i => ({ label: i, color: 'green' as const, type: 'Intervention' })) || []),
    ...(document.keyPopulations?.map(kp => ({ label: kp, color: 'blue' as const, type: 'Key Population' })) || []),
    ...(document.keyOrganizations?.map(ko => ({ label: ko, color: 'yellow' as const, type: 'Key Organization' })) || []),
  ];

  return (
    <div className="bg-base-100 dark:bg-dark-base-200 rounded-2xl p-6 border border-base-300 dark:border-dark-base-100 transition-all duration-300 hover:border-brand-primary hover:shadow-2xl hover:shadow-brand-primary/10">
      <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{document.title}</h4>
      <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        <span>
            {document.authors.map((author, index) => (
                <React.Fragment key={author}>
                    <button onClick={() => onAuthorClick(author)} className="hover:underline hover:text-brand-primary dark:hover:text-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent rounded">
                        {author}
                    </button>
                    {index < document.authors.length - 1 && ', '}
                </React.Fragment>
            ))}
        </span>
        {(document.year || document.publicationTitle) && <span className="mx-2">|</span>}
        {document.year && <span>{document.year}</span>}
        {(document.year && document.publicationTitle) && <span className="mx-1">,</span>}
        {document.publicationTitle && <span className="italic">{document.publicationTitle}</span>}
      </div>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
        {document.simplifiedSummary || document.summary}
      </p>

      {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
              {allTags.map(tag => (
                  <Tag key={`${tag.type}-${tag.label}`} label={tag.label} color={tag.color} />
              ))}
          </div>
      )}

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-base-300 dark:border-dark-base-100 space-y-4 animate-fade-in">
          {document.simplifiedSummary && document.summary !== document.simplifiedSummary && (
            <div>
              <h5 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Full Summary</h5>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{document.summary}</p>
            </div>
          )}
          {document.keyStats && document.keyStats.length > 0 && (
            <div>
              <h5 className="font-semibold text-slate-800 dark:text-slate-100 mb-2">Key Statistics</h5>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400">
                {document.keyStats.map((stat, index) => <li key={index}>{stat}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-base-300 dark:border-dark-base-100 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <ActionButton 
          onClick={() => setIsExpanded(!isExpanded)} 
          aria-label={isExpanded ? 'Show fewer details' : 'Show more details'}
        >
          <ChevronDownIcon className={`h-5 w-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          {isExpanded ? 'Fewer Details' : 'More Details'}
        </ActionButton>

        <div className="flex items-center justify-end gap-2 flex-wrap">
          <ActionButton 
              href={document.pdfUrl} 
              disabled={!document.pdfUrl || document.pdfUrl === '#'} 
              aria-label={`Download PDF for ${document.title}`}
          >
              <DownloadIcon /> <span className="hidden md:inline">Download</span>
          </ActionButton>
          <ActionButton 
              onClick={onViewPdf} 
              disabled={!document.pdfUrl || document.pdfUrl === '#'} 
              aria-label={`View PDF for ${document.title} in-app`}
          >
              <EyeIcon /> <span className="hidden md:inline">View PDF</span>
          </ActionButton>
          <ActionButton onClick={onFindRelated} aria-label={`Find documents related to ${document.title}`}>
              <LinkIcon /> <span className="hidden md:inline">Find Related</span>
          </ActionButton>
          <ActionButton onClick={onCite} aria-label={`Cite ${document.title}`}>
              <CiteIcon /> <span className="hidden md:inline">Cite</span>
          </ActionButton>
          <ActionButton onClick={onToggleSave} isPrimary aria-label={isSaved ? `Remove ${document.title} from your list` : `Add ${document.title} to your list`}>
              <BookmarkIcon isSaved={isSaved} /> {isSaved ? 'Saved' : 'Add to List'}
          </ActionButton>
        </div>
      </div>
    </div>
  );
};

export const ResultCardSkeleton: React.FC = () => {
  return (
    <div className="bg-base-100 dark:bg-dark-base-200 rounded-2xl p-6 border border-base-300 dark:border-dark-base-100 animate-pulse">
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-5"></div>
      <div className="space-y-3 mb-5">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-base-300 dark:border-dark-base-100">
        <div className="h-9 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        <div className="h-9 w-28 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        <div className="h-9 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
        <div className="h-9 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
      </div>
    </div>
  );
}