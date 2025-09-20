import React from 'react';
import type { Document } from '../types';
import { BookmarkIcon, CiteIcon, DownloadIcon, LinkIcon } from '../constants';

interface ResultCardProps {
  document: Document;
  isSaved: boolean;
  onToggleSave: () => void;
  onCite: () => void;
  onFindRelated: () => void;
}

const ActionButton: React.FC<{
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  children: React.ReactNode;
  'aria-label': string;
}> = ({ onClick, href, disabled, children, 'aria-label': ariaLabel }) => {
  const commonClasses = "flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const enabledClasses = "bg-base-200 dark:bg-dark-base-100 hover:bg-base-300 dark:hover:bg-dark-base-200 text-slate-700 dark:text-slate-200";

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

const Tag: React.FC<{ label: string; color: 'blue' | 'green' | 'purple' }> = ({ label, color }) => {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    };
    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${colorClasses[color]}`}>
            {label}
        </span>
    );
};

export const ResultCard: React.FC<ResultCardProps> = ({ document, isSaved, onToggleSave, onCite, onFindRelated }) => {
  const allTags = [
    ...(document.riskFactors?.map(rf => ({ label: rf, color: 'purple' as const, type: 'Risk Factor' })) || []),
    ...(document.interventions?.map(i => ({ label: i, color: 'green' as const, type: 'Intervention' })) || []),
    ...(document.keyPopulations?.map(kp => ({ label: kp, color: 'blue' as const, type: 'Key Population' })) || []),
  ];

  return (
    <div className="bg-base-100 dark:bg-dark-base-300 rounded-xl shadow-md overflow-hidden p-6 border border-base-300 dark:border-slate-700 transition-all duration-300 hover:shadow-xl hover:border-brand-accent">
      <h4 className="text-xl font-bold text-brand-primary dark:text-brand-accent mb-1">{document.title}</h4>
      <div className="text-sm text-slate-500 dark:text-slate-400 mb-3">
        <span>{document.authors.join(', ')}</span>
        {(document.year || document.publicationTitle) && <span className="mx-2">|</span>}
        {document.year && <span>{document.year}</span>}
        {(document.year && document.publicationTitle) && <span className="mx-1">,</span>}
        {document.publicationTitle && <span className="italic">{document.publicationTitle}</span>}
      </div>
      <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
        {document.simplifiedSummary || document.summary}
      </p>

      {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
              {allTags.map(tag => (
                  <Tag key={`${tag.type}-${tag.label}`} label={tag.label} color={tag.color} />
              ))}
          </div>
      )}

      <div className="border-t border-base-200 dark:border-slate-700 pt-4 flex items-center justify-end gap-2">
        <ActionButton 
            href={document.pdfUrl} 
            disabled={!document.pdfUrl || document.pdfUrl === '#'} 
            aria-label={`Download PDF for ${document.title}`}
        >
            <DownloadIcon /> Download
        </ActionButton>
        <ActionButton onClick={onFindRelated} aria-label={`Find documents related to ${document.title}`}>
            <LinkIcon /> Find Related
        </ActionButton>
        <ActionButton onClick={onCite} aria-label={`Cite ${document.title}`}>
            <CiteIcon /> Cite
        </ActionButton>
        <ActionButton onClick={onToggleSave} aria-label={isSaved ? `Remove ${document.title} from your list` : `Add ${document.title} to your list`}>
            <BookmarkIcon isSaved={isSaved} /> {isSaved ? 'Saved' : 'Add to List'}
        </ActionButton>
      </div>
    </div>
  );
};

export const ResultCardSkeleton: React.FC = () => {
  return (
    <div className="bg-base-100 dark:bg-dark-base-300 rounded-xl shadow-md p-6 border border-base-300 dark:border-slate-700 animate-pulse">
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t border-base-200 dark:border-slate-700">
        <div className="h-8 w-28 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
        <div className="h-8 w-28 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
        <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
        <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
      </div>
    </div>
  );
}
