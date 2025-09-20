import React, { useMemo } from 'react';
import type { Document } from '../types';

interface DataVisualizationsProps {
  documents: Document[];
}

interface YearData {
  year: number;
  count: number;
}

interface PhraseData {
  phrase: string;
  count: number;
}

const KEY_PHRASES = [
    'poverty', 
    'restorative justice', 
    'zero tolerance', 
    'disability', 
    'racial disparity',
    'suspension',
    'expulsion'
];

// Helper to format phrases nicely for display
const formatPhrase = (phrase: string) => {
    return phrase.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

export const DataVisualizations: React.FC<DataVisualizationsProps> = ({ documents }) => {
  const publicationsByYear = useMemo<YearData[]>(() => {
    const counts: { [year: number]: number } = {};
    documents.forEach(doc => {
      if (doc.year) {
        counts[doc.year] = (counts[doc.year] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([year, count]) => ({ year: Number(year), count }))
      .sort((a, b) => a.year - b.year);
  }, [documents]);

  const phraseMentions = useMemo<PhraseData[]>(() => {
    const counts: { [phrase: string]: number } = {};
    KEY_PHRASES.forEach(phrase => counts[phrase] = 0);

    documents.forEach(doc => {
      const textToSearch = `${doc.summary} ${doc.simplifiedSummary || ''}`.toLowerCase();
      KEY_PHRASES.forEach(phrase => {
        const regex = new RegExp(phrase.toLowerCase(), 'g');
        const occurrences = (textToSearch.match(regex) || []).length;
        if (occurrences > 0) {
            counts[phrase] += occurrences;
        }
      });
    });

    return Object.entries(counts)
      .map(([phrase, count]) => ({ phrase, count }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [documents]);

  const maxYearCount = useMemo(() => {
    return Math.max(...publicationsByYear.map(d => d.count), 0);
  }, [publicationsByYear]);
  
  const maxPhraseCount = useMemo(() => {
    return Math.max(...phraseMentions.map(d => d.count), 0);
  }, [phraseMentions]);

  const hasYearData = publicationsByYear.length > 0;
  const hasPhraseData = phraseMentions.length > 0;

  if (!hasYearData && !hasPhraseData) {
    return null; // Don't render anything if there's no data
  }

  return (
    <div 
        className="bg-base-100 dark:bg-dark-base-300 rounded-xl shadow-md p-6 border border-base-300 dark:border-slate-700"
        role="figure"
        aria-labelledby="viz-title"
    >
      {hasYearData && (
        <div role="group" aria-labelledby="chart-title-year">
          <h3 id="chart-title-year" className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
            Publications by Year
          </h3>
          <div className="space-y-3">
            {publicationsByYear.map(({ year, count }) => (
              <div 
                key={year} 
                className="grid grid-cols-12 items-center gap-2 group"
                aria-label={`${count} publication${count > 1 ? 's' : ''} in ${year}`}
              >
                <span className="col-span-2 text-sm font-medium text-slate-600 dark:text-slate-400 text-right">
                  {year}
                </span>
                <div className="col-span-10 flex items-center">
                  <div 
                    className="bg-brand-secondary h-6 rounded-r-md transition-all duration-500 ease-out"
                    style={{ width: `${maxYearCount > 0 ? (count / maxYearCount) * 100 : 0}%` }}
                    role="presentation"
                  />
                  <span className="ml-2 text-sm font-bold text-brand-primary dark:text-brand-accent">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasYearData && hasPhraseData && <hr className="my-6 border-base-300 dark:border-slate-700" />}

      {hasPhraseData && (
        <div role="group" aria-labelledby="chart-title-phrases">
            <h3 id="chart-title-phrases" className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                Key Phrase Mentions
            </h3>
            <div className="space-y-3">
                {phraseMentions.map(({ phrase, count }) => (
                    <div 
                        key={phrase} 
                        className="grid grid-cols-12 items-center gap-2 group"
                        aria-label={`${phrase} mentioned ${count} time${count > 1 ? 's' : ''}`}
                    >
                        <span className="col-span-4 md:col-span-3 text-sm font-medium text-slate-600 dark:text-slate-400 text-right truncate" title={formatPhrase(phrase)}>
                            {formatPhrase(phrase)}
                        </span>
                        <div className="col-span-8 md:col-span-9 flex items-center">
                            <div 
                                className="bg-brand-accent h-6 rounded-r-md transition-all duration-500 ease-out"
                                style={{ width: `${maxPhraseCount > 0 ? (count / maxPhraseCount) * 100 : 0}%` }}
                                role="presentation"
                            />
                            <span className="ml-2 text-sm font-bold text-brand-primary dark:text-brand-accent">
                                {count}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};
