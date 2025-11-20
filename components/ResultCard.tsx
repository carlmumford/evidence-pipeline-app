import React, { useState } from 'react';
import type { Document } from '../types';
import { BookmarkIcon, CiteIcon, DownloadIcon, ChevronDownIcon, ChevronUpIcon, MapPinIcon, BeakerIcon, UsersIcon, CheckCircleIcon } from '../constants';

const StrengthOfEvidenceTag: React.FC<{ level?: string }> = ({ level }) => {
    if (!level) return null;

    const levelLower = level.toLowerCase();
    // Modern pastel palette with subtle transparency
    let colorClasses = 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';

    if (levelLower.includes('systematic review') || levelLower.includes('meta-analysis')) {
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
    } else if (levelLower.includes('randomised controlled trial') || levelLower.includes('rct')) {
        colorClasses = 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
    } else if (levelLower.includes('observational') || levelLower.includes('cohort')) {
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
    } else if (levelLower.includes('qualitative')) {
        colorClasses = 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20';
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses} whitespace-nowrap`}>
            {level}
        </span>
    );
};

const SummarySection: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => {
    if (!children) return null;
    const isList = typeof children === 'string' && children.includes(';');
    
    return (
        <div className="pb-5 last:pb-0 animate-fade-in">
            <h5 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{title}</h5>
            {isList ? (
                 <ul className="space-y-1.5">
                    {(children as string).split(';').map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <span className="block w-1.5 h-1.5 mt-1.5 rounded-full bg-accent/40 flex-shrink-0"></span>
                            <span className="leading-relaxed">{item.trim()}</span>
                        </li>
                    ))}
                 </ul>
            ) : (
                <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {children}
                </div>
            )}
        </div>
    );
};

export const ResultCardSkeleton: React.FC = () => (
    <div className="p-6 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 animate-pulse mb-4">
        <div className="flex justify-between mb-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
        </div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
        <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
    </div>
);

interface ResultCardProps {
    document: Document;
    isSaved: boolean;
    onToggleSave: () => void;
    onCite: () => void;
    onFindRelated: () => void;
    onViewPdf: () => void;
    onAuthorClick: (author: string) => void;
    selected?: boolean;
    onSelect?: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ 
    document, 
    isSaved, 
    onToggleSave, 
    onCite, 
    onFindRelated, 
    onViewPdf, 
    onAuthorClick,
    selected,
    onSelect
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showFullSummary, setShowFullSummary] = useState(false);

    const summaryPreview = document.simplifiedSummary.length > 280 
        ? document.simplifiedSummary.substring(0, 280) + "..." 
        : document.simplifiedSummary;

    const isPeerReviewed = document.resourceType?.toLowerCase().includes('journal');

    return (
        <article 
            className={`group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 mb-4 overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 hover:border-gray-200 dark:hover:border-gray-700 ${isExpanded ? 'shadow-md ring-1 ring-gray-200 dark:ring-gray-700' : 'shadow-sm'} ${selected ? 'ring-2 ring-accent border-accent dark:border-accent' : ''}`}
        >
            <div className="p-5 md:p-7">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                    {onSelect && (
                        <div className="flex-shrink-0 pt-1.5 pr-2">
                             <input 
                                type="checkbox" 
                                checked={selected} 
                                onChange={onSelect}
                                className="h-5 w-5 rounded border-gray-300 text-accent focus:ring-accent"
                             />
                        </div>
                    )}
                    <div className="space-y-2 flex-grow">
                         <div className="flex flex-wrap gap-2 mb-3 items-center">
                             {document.resourceType && (
                                 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 uppercase tracking-wide">
                                     {isPeerReviewed && <CheckCircleIcon className="h-3 w-3 text-accent"/>}
                                     {document.resourceType}
                                 </span>
                             )}
                             <StrengthOfEvidenceTag level={document.strengthOfEvidence} />
                         </div>
                        
                        <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight group-hover:text-accent transition-colors duration-200 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                            {document.title}
                        </h3>
                        
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap gap-y-1 items-center leading-relaxed">
                            {document.authors.map((author, idx) => (
                                <React.Fragment key={idx}>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onAuthorClick(author); }}
                                        className="hover:text-accent hover:underline transition-colors font-medium"
                                    >
                                        {author}
                                    </button>
                                    {idx < document.authors.length - 1 && <span className="mr-1">, </span>}
                                </React.Fragment>
                            ))}
                            <span className="mx-2.5 text-gray-300 dark:text-gray-600">•</span>
                            <span>{document.year || 'n.d.'}</span>
                            {document.publicationTitle && (
                                <>
                                   <span className="mx-2.5 text-gray-300 dark:text-gray-600">•</span>
                                   <span className="italic text-gray-600 dark:text-gray-300">{document.publicationTitle}</span>
                                </>
                            )}
                        </div>
                        
                        {/* New Metadata Row */}
                        <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                            {document.location && (
                                <div className="flex items-center gap-1">
                                    <MapPinIcon className="h-3.5 w-3.5" />
                                    <span>{document.location}</span>
                                </div>
                            )}
                            {document.methods && (
                                <div className="flex items-center gap-1">
                                    <BeakerIcon className="h-3.5 w-3.5" />
                                    <span className="truncate max-w-[150px]" title={document.methods}>{document.methods}</span>
                                </div>
                            )}
                             {document.sampleSize && (
                                <div className="flex items-center gap-1">
                                    <UsersIcon className="h-3.5 w-3.5" />
                                    <span>{document.sampleSize}</span>
                                </div>
                            )}
                        </div>

                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 self-start md:self-center bg-white dark:bg-gray-900 rounded-full shadow-sm border border-gray-100 dark:border-gray-800 p-1">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
                            className={`p-2 rounded-full transition-all duration-200 ${isSaved ? 'text-accent bg-accent/10' : 'text-gray-400 hover:text-accent hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                            title={isSaved ? "Remove from list" : "Save to list"}
                        >
                            <BookmarkIcon className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} isSaved={isSaved} />
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onCite(); }}
                            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-200 rounded-full transition-all duration-200"
                            title="Cite"
                        >
                            <CiteIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="mt-5">
                    <div className="text-sm md:text-[15px] text-gray-600 dark:text-gray-300 leading-relaxed">
                        <span className="inline-block font-semibold text-gray-900 dark:text-gray-100 mr-2 mb-1 bg-gradient-to-r from-gray-100 to-white dark:from-gray-800 dark:to-gray-900 px-2 py-0.5 rounded text-xs uppercase tracking-wide border border-gray-200 dark:border-gray-700">AI Summary</span>
                        {showFullSummary ? document.simplifiedSummary : summaryPreview}
                        {document.simplifiedSummary.length > 280 && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowFullSummary(!showFullSummary); }}
                                className="ml-2 text-accent font-medium hover:text-accent-dark hover:underline focus:outline-none text-xs uppercase tracking-wide"
                            >
                                {showFullSummary ? "Show less" : "Read more"}
                            </button>
                        )}
                    </div>
                    
                    {/* Tags Preview (Risk Factors / Interventions) - Only show a few if collapsed */}
                    {!isExpanded && (
                         <div className="mt-5 flex flex-wrap gap-2">
                             {[...(document.riskFactors || []), ...(document.interventions || [])].slice(0, 4).map((tag, i) => (
                                 <span 
                                    key={i} 
                                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 cursor-help transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                                    title={`Filter by ${tag}`}
                                 >
                                     {tag}
                                 </span>
                             ))}
                             {(document.riskFactors.length + document.interventions.length) > 4 && (
                                 <span className="text-xs text-gray-400 self-center font-medium">+{document.riskFactors.length + document.interventions.length - 4} more</span>
                             )}
                         </div>
                    )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                    <div className="mt-8 pt-6 border-t border-dashed border-gray-200 dark:border-gray-700 animate-fade-in">
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                             <div className="space-y-6">
                                 <SummarySection title="Key Findings">{document.keyFindings}</SummarySection>
                                 <SummarySection title="Methodology">{document.methods}</SummarySection>
                                 <SummarySection title="Aim">{document.aim}</SummarySection>
                             </div>
                             <div className="space-y-6">
                                 <SummarySection title="Risk Factors">
                                     {document.riskFactors.length > 0 ? document.riskFactors.join('; ') : null}
                                 </SummarySection>
                                 <SummarySection title="Interventions">
                                     {document.interventions.length > 0 ? document.interventions.join('; ') : null}
                                 </SummarySection>
                                 <SummarySection title="Key Populations">
                                     {document.keyPopulations.length > 0 ? document.keyPopulations.join('; ') : null}
                                 </SummarySection>
                                 <SummarySection title="Implications">{document.implications}</SummarySection>
                             </div>
                         </div>
                         
                         <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                             {document.pdfUrl && (
                                 <button 
                                     onClick={(e) => { e.stopPropagation(); onViewPdf(); }}
                                     className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-accent hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all hover:-translate-y-0.5"
                                 >
                                     <DownloadIcon className="-ml-1 mr-2 h-4 w-4" />
                                     Read Full PDF
                                 </button>
                             )}
                             <button
                                onClick={(e) => { e.stopPropagation(); onFindRelated(); }}
                                className="inline-flex items-center px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-all hover:-translate-y-0.5"
                             >
                                 Find Related Evidence
                             </button>
                         </div>
                         
                         {/* Original Abstract Fallback */}
                         {document.summary !== document.simplifiedSummary && (
                             <div className="mt-6 pt-4">
                                 <details className="group/details">
                                     <summary className="text-xs font-bold uppercase tracking-wider text-gray-400 cursor-pointer hover:text-accent transition-colors list-none flex items-center gap-2">
                                         <span className="group-open/details:hidden">Show original abstract</span>
                                         <span className="hidden group-open/details:inline">Hide original abstract</span>
                                         <ChevronDownIcon className="h-3 w-3 transition-transform group-open/details:rotate-180" />
                                     </summary>
                                     <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 italic leading-relaxed pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                                         {document.summary}
                                     </p>
                                 </details>
                             </div>
                         )}
                    </div>
                )}
            </div>
            
            {/* Expand Toggle Bar */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full py-3 bg-gray-50/50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/80 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 transition-colors focus:outline-none border-t border-gray-100 dark:border-gray-800 group/toggle"
            >
                <span>{isExpanded ? "Close Details" : "View Analysis & Key Findings"}</span>
                {isExpanded ? (
                    <ChevronUpIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover/toggle:-translate-y-0.5" />
                ) : (
                    <ChevronDownIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover/toggle:translate-y-0.5" />
                )}
            </button>
        </article>
    );
};