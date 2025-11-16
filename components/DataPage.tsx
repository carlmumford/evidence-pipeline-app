import React from 'react';
import type { Document } from '../types';
import { PipelineInfographic } from './PipelineInfographic';
import { TopicBreakdownCharts } from './DataVisualizations';
import { EvidenceMap } from './EvidenceMap';

interface DataPageProps {
    documents: Document[];
    onSearch: (query: string) => void;
    onReturn: () => void;
}

const Section: React.FC<{title: string; description: string; children: React.ReactNode;}> = ({ title, description, children }) => (
    <section className="mb-12">
        <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{title}</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">{description}</p>
        </div>
        {children}
    </section>
);


export const DataPage: React.FC<DataPageProps> = ({ documents, onSearch, onReturn }) => {
    return (
        <div className="animate-fade-in p-4 md:p-8">
             <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Data & Insights</h2>
                <button 
                    onClick={onReturn}
                    className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-75 transition-colors"
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
                title="Global Evidence Map"
                description="Explore where research has been conducted. Enter your location or use the location button to see research near you, or click on a marker to discover studies from that area."
            >
                <EvidenceMap documents={documents} onNodeClick={onSearch} />
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