import React from 'react';
import type { Document } from '../types';
import { PipelineInfographic } from './PipelineInfographic';
import { TrendCharts } from './TrendCharts';
import { TopicBreakdownCharts } from './TopicBreakdownCharts';
import { EvidenceMap } from './EvidenceMap';

interface DataPageProps {
    documents: Document[];
    onSearch: (query: string) => void;
    onReturn: () => void;
}

const Section: React.FC<{title: string; description: string; children: React.ReactNode;}> = ({ title, description, children }) => (
    <section className="mb-12">
        <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200">{title}</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">{description}</p>
        </div>
        {children}
    </section>
);


export const DataPage: React.FC<DataPageProps> = ({ documents, onSearch, onReturn }) => {
    return (
        <div className="animate-fade-in">
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-brand-primary dark:text-brand-accent">Data & Insights</h2>
                <button 
                    onClick={onReturn}
                    className="px-4 py-2 text-sm bg-base-200 dark:bg-dark-base-100 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-base-300 dark:hover:bg-dark-base-200 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-opacity-75 transition-colors"
                >
                &larr; Back to Search
                </button>
            </div>

            <Section 
                title="The School to Prison Pipeline"
                description="This infographic shows the common stages of the pipeline. Click on any stage to see related evidence and research from the repository."
            >
                <PipelineInfographic onStageClick={onSearch} />
            </Section>

            <Section
                title="Evidence Map"
                description="This experimental network graph visualizes connections between documents. Papers that share common themes are linked together. Click a node to search for that document."
            >
                <EvidenceMap documents={documents} onNodeClick={onSearch} />
            </Section>

            <Section
                title="Trends Over Time"
                description="Visualize how research focus and publication volume have evolved. These charts are generated from the metadata of all documents in the evidence library."
            >
                <TrendCharts documents={documents} />
            </Section>
            
            <Section
                title="Evidence Dashboard"
                description="Explore the most frequently mentioned risk factors, key populations, and interventions across all uploaded documents."
            >
                <TopicBreakdownCharts documents={documents} onTermClick={onSearch} />
            </Section>
            
        </div>
    );
};