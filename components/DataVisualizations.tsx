import React, { useMemo } from 'react';
import type { Document } from '../types';

interface TopicBreakdownChartsProps {
  documents: Document[];
  onTermClick: (term: string) => void;
}

type DataItem = {
  name: string;
  count: number;
};

// Helper to format phrases nicely for display
const formatPhrase = (phrase: string) => {
    return phrase.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const getTopItems = (documents: Document[], key: 'riskFactors' | 'keyPopulations' | 'interventions', count: number): DataItem[] => {
    const counts: { [item: string]: number } = {};
    documents.forEach(doc => {
      (doc[key] || []).forEach(item => {
        const cleanedItem = item.toLowerCase();
        counts[cleanedItem] = (counts[cleanedItem] || 0) + 1;
      });
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, count);
};

const Chart: React.FC<{ title: string; data: DataItem[]; color: string; onTermClick: (term:string) => void; }> = ({ title, data, color, onTermClick }) => {
    const maxCount = Math.max(...data.map(d => d.count), 0);

    if (data.length === 0) return null;

    return (
        <div role="group" aria-labelledby={`chart-title-${title.replace(/\s+/g, '-')}`}>
            <h3 id={`chart-title-${title.replace(/\s+/g, '-')}`} className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">
                Top {title}
            </h3>
            <div className="space-y-3">
                {data.map(({ name, count }) => (
                    <button 
                        key={name}
                        onClick={() => onTermClick(name)}
                        className="w-full grid grid-cols-12 items-center gap-2 group text-left"
                        aria-label={`${formatPhrase(name)}, mentioned in ${count} document${count > 1 ? 's' : ''}. Click to search for this term.`}
                    >
                        <span className="col-span-5 md:col-span-4 text-sm font-medium text-slate-600 dark:text-slate-400 text-right truncate group-hover:text-brand-primary dark:group-hover:text-brand-accent" title={formatPhrase(name)}>
                            {formatPhrase(name)}
                        </span>
                        <div className="col-span-7 md:col-span-8 flex items-center">
                            <div 
                                className={`${color} h-6 rounded-r-md transition-all duration-500 ease-out group-hover:opacity-80`}
                                style={{ width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%` }}
                                role="presentation"
                            />
                            <span className="ml-2 text-sm font-bold text-brand-primary dark:text-brand-accent">
                                {count}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export const TopicBreakdownCharts: React.FC<TopicBreakdownChartsProps> = ({ documents, onTermClick }) => {
  const topRiskFactors = useMemo(() => getTopItems(documents, 'riskFactors', 5), [documents]);
  const topPopulations = useMemo(() => getTopItems(documents, 'keyPopulations', 5), [documents]);
  const topInterventions = useMemo(() => getTopItems(documents, 'interventions', 5), [documents]);

  const hasData = topRiskFactors.length > 0 || topPopulations.length > 0 || topInterventions.length > 0;

  if (!hasData) {
    return (
        <div className="bg-base-100 dark:bg-dark-base-300 rounded-xl shadow-md p-6 border border-base-300 dark:border-slate-700 text-center">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Evidence Dashboard</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Upload more documents with tagged risk factors, populations, and interventions to see an overview here.</p>
        </div>
    );
  }

  return (
    <div 
        className="bg-base-100 dark:bg-dark-base-300 rounded-xl shadow-md p-6 border border-base-300 dark:border-slate-700"
        role="figure"
        aria-labelledby="viz-title"
    >
        <h2 id="viz-title" className="text-xl font-bold text-center text-brand-primary dark:text-brand-accent mb-6">Evidence Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Chart title="Risk Factors" data={topRiskFactors} color="bg-purple-500" onTermClick={onTermClick} />
            <Chart title="Key Populations" data={topPopulations} color="bg-blue-500" onTermClick={onTermClick} />
            <Chart title="Interventions" data={topInterventions} color="bg-green-500" onTermClick={onTermClick} />
        </div>
    </div>
  );
};