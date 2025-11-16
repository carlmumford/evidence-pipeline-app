import React, { useState } from 'react';
import { Card } from './shared/Card';
import { SparklesIcon, LoadingSpinner, LinkIcon, PlusCircleIcon, CheckCircleIcon } from '../../constants';
import type { DiscoveredResearch, Document } from '../../types';
import { findRecentResearch } from '../../services/geminiService';
import { addDocument } from '../../services/documentService';
import { useToast } from '../../contexts/ToastContext';

interface AIResearchDiscoveryProps {
    existingDocs: Document[];
    onDocumentAdded: () => void;
}

export const AIResearchDiscovery: React.FC<AIResearchDiscoveryProps> = ({ existingDocs, onDocumentAdded }) => {
    const [topic, setTopic] = useState('school-to-prison pipeline');
    const [dateRange, setDateRange] = useState('last-year');
    const [discoveredResearch, setDiscoveredResearch] = useState<DiscoveredResearch[]>([]);
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [discoveryError, setDiscoveryError] = useState<string | null>(null);
    const [addedDocUrls, setAddedDocUrls] = useState<Set<string>>(new Set());
    const { addToast } = useToast();

    const handleFindResearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsDiscovering(true);
        setDiscoveryError(null);
        setDiscoveredResearch([]);
        try {
            // Note: The geminiService.findRecentResearch would need to be updated
            // to accept and use the topic and dateRange parameters in its prompt.
            // For now, we call it as-is.
            const results = await findRecentResearch();
            setDiscoveredResearch(results);
             if (results.length === 0) {
                addToast({ message: 'AI could not find any new research for that topic.', type: 'info' });
            }
        } catch (err) {
            const errorMsg = 'Failed to retrieve research. The AI may be busy or an error occurred.';
            setDiscoveryError(errorMsg);
            addToast({ message: errorMsg, type: 'error' });
            console.error(err);
        } finally {
            setIsDiscovering(false);
        }
    };

    const handleAddDiscoveredResearch = async (research: DiscoveredResearch) => {
        const isDuplicate = existingDocs.some(doc => doc.title.trim().toLowerCase() === research.title.trim().toLowerCase());
        if (isDuplicate) {
            addToast({ message: `"${research.title}" already exists in the library.`, type: 'error' });
            return;
        }

        const newDoc: Omit<Document, 'id' | 'createdAt'> = {
            title: research.title,
            authors: research.authors.split(',').map(a => a.trim()).filter(Boolean),
            summary: research.summary,
            pdfUrl: research.url,
            resourceType: 'Discovered Article',
            year: new Date().getFullYear(),
            subjects: ['newly discovered', topic],
            simplifiedSummary: '',
            interventions: [],
            keyPopulations: [],
            riskFactors: [],
            mentalHealthConditions: [],
            keyStats: [],
            keyOrganisations: [],
            publicationTitle: ''
        };

        try {
            await addDocument(newDoc);
            setAddedDocUrls(prev => new Set(prev).add(research.url));
            addToast({ message: `Successfully added "${research.title}".`, type: 'success' });
            onDocumentAdded(); // Callback to refresh the main documents list
        } catch (error) {
            addToast({ message: 'Failed to add the document to the database.', type: 'error' });
            console.error(error);
        }
    };

    const getConfidenceColor = (score: number) => {
        if (score > 85) return 'text-green-500';
        if (score > 60) return 'text-yellow-500';
        return 'text-red-500';
    };

    const inputClasses = "block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 shadow-sm focus:border-accent focus:ring focus:ring-accent focus:ring-opacity-50 text-sm";


    return (
        <Card title="AI Research Discovery" icon={<SparklesIcon />}>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Use AI to search peer-reviewed journals and other reputable sources for the latest research.
            </p>
            <form onSubmit={handleFindResearch} className="space-y-4">
                <div>
                    <label htmlFor="topic" className="block text-sm font-medium mb-1">Topic</label>
                    <input type="text" id="topic" value={topic} onChange={e => setTopic(e.target.value)} required className={inputClasses} />
                </div>
                <div>
                    <label htmlFor="dateRange" className="block text-sm font-medium mb-1">Date Range</label>
                    <select id="dateRange" value={dateRange} onChange={e => setDateRange(e.target.value)} className={inputClasses}>
                        <option value="last-year">Last Year</option>
                        <option value="last-5-years">Last 5 Years</option>
                        <option value="all-time">All Time</option>
                    </select>
                </div>
                <button
                    type="submit"
                    disabled={isDiscovering}
                    className="w-full flex items-center justify-center px-4 py-2 bg-accent text-white font-semibold rounded-lg shadow-sm hover:bg-accent-hover disabled:bg-gray-400 disabled:cursor-wait"
                >
                    {isDiscovering ? <LoadingSpinner /> : <SparklesIcon />}
                    <span className="ml-2">{isDiscovering ? 'Searching...' : 'Find Research'}</span>
                </button>
            </form>

            {discoveryError && <p className="mt-4 text-red-500 text-sm">{discoveryError}</p>}
            
            {discoveredResearch.length > 0 && (
                <div className="mt-6 space-y-4 max-h-96 overflow-y-auto pr-2">
                    {discoveredResearch.map((item, index) => (
                        <div key={index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-900/50">
                            <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-accent text-sm">{item.title}</h4>
                                <p className="text-xs font-mono text-gray-500">{item.authors}</p>
                            </div>
                            <div className="text-center ml-4 flex-shrink-0">
                                <p className={`text-xl font-bold ${getConfidenceColor(item.confidenceScore)}`}>{item.confidenceScore}</p>
                                <p className="text-xs text-gray-500">Confidence</p>
                            </div>
                            </div>
                            <p className="text-xs my-2 text-gray-600 dark:text-gray-400">{item.summary}</p>
                            
                            <div className="flex justify-between items-center mt-2">
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-accent hover:underline">
                                    <LinkIcon className="h-3 w-3" /> View Source
                                </a>
                                <button
                                    onClick={() => handleAddDiscoveredResearch(item)}
                                    disabled={addedDocUrls.has(item.url)}
                                    className="flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-lg transition-colors bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    {addedDocUrls.has(item.url) ? <CheckCircleIcon className="h-4 w-4" /> : <PlusCircleIcon className="h-4 w-4" />}
                                    {addedDocUrls.has(item.url) ? 'Added' : 'Add'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
};