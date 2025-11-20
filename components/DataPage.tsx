import React from 'react';
import type { Document } from '../types';
import { PipelineInfographic } from './PipelineInfographic';
import { TopicBreakdownCharts } from './DataVisualizations';
import { EvidenceMap } from './EvidenceMap';
import { TrendCharts } from './TrendCharts';

interface DataPageProps {
    documents: Document[];
    onSearch: (query: string) => void;
    onReturn: () => void;
}

const Section: React.FC<{title: string; description: string; children: React.ReactNode; className?: string}> = ({ title, description, children, className = '' }) => (
    <section className={`mb-16 ${className}`}>
        <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mt-2">{description}</p>
        </div>
        {children}
    </section>
);

export const DataPage: React.FC<DataPageProps> = ({ documents, onSearch, onReturn }) => {
    return (
        <div className="animate-fade-in p-4 md:p-8 max-w-7xl mx-auto">
             <div className="flex justify-between items-center mb-12">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Data & Insights</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Explore trends, patterns, and geography of the evidence base.</p>
                </div>
                <button 
                    onClick={onReturn}
                    className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-75 transition-colors"
                >
                &larr; Back to Search
                </button>
            </div>

            <Section 
                title="The School to Prison Pipeline"
                description="Visualising the stages from school environment to incarceration. Click on any stage to filter the evidence repository."
            >
                <PipelineInfographic onStageClick={onSearch} />
            </Section>

            <Section
                title="Trends in Research"
                description="How the focus on the pipeline and exclusionary practices has evolved over recent decades."
            >
                <TrendCharts documents={documents} />
            </Section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
                <Section
                    title="Global Evidence Map"
                    description="Explore where research has been conducted. Click markers to see studies from that location."
                    className="mb-0"
                >
                    <EvidenceMap documents={documents} onNodeClick={onSearch} />
                </Section>
                
                <Section
                    title="Key Themes Dashboard"
                    description="The most frequently mentioned risk factors, populations, and interventions."
                    className="mb-0"
                >
                    <TopicBreakdownCharts documents={documents} onTermClick={onSearch} />
                </Section>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-8 border border-gray-200 dark:border-gray-800">
                <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Data Sources & Transparency</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    This platform aggregates evidence from peer-reviewed journals, grey literature, and reputable NGO reports. 
                    The data visualized above is derived dynamically from the metadata of the documents currently indexed in our system.
                </p>
                <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li><strong>Metadata Extraction:</strong> Powered by AI analysis of uploaded PDFs.</li>
                    <li><strong>Updates:</strong> The database is updated weekly by our research team.</li>
                    <li><strong>Coverage:</strong> Primarily focuses on UK and US contexts, with growing international coverage.</li>
                </ul>
            </div>
            
        </div>
    );
};