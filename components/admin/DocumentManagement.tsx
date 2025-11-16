import React, { useState, useMemo } from 'react';
import type { Document } from '../../types';
import { Card } from './shared/Card';
import { DocumentIcon, TrashIcon, EyeIcon, SearchIcon, ChevronUpIcon, ChevronsUpDownIcon, ChevronDownIcon } from '../../constants';
import { deleteDocument } from '../../services/documentService';
import { useToast } from '../../contexts/ToastContext';
import { authService } from '../../services/authService';

type SortKey = keyof Pick<Document, 'title' | 'authors' | 'year'>;
type SortDirection = 'asc' | 'desc';

interface DocumentManagementProps {
  initialDocuments: Document[];
  onDocumentsChange: () => void;
  onViewPdf: (doc: Document) => void;
}

export const DocumentManagement: React.FC<DocumentManagementProps> = ({ initialDocuments, onDocumentsChange, onViewPdf }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [sortKey, setSortKey] = useState<SortKey>('title');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const { addToast } = useToast();
    const currentUser = useMemo(() => authService.getCurrentUser(), []);

    const sortedAndFilteredDocuments = useMemo(() => {
        let docs = [...initialDocuments].filter(doc =>
            doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.authors.some(author => author.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        docs.sort((a, b) => {
            let valA: string | number = '';
            let valB: string | number = '';

            if (sortKey === 'authors') {
                valA = a.authors.join(', ');
                valB = b.authors.join(', ');
            } else if (sortKey === 'year') {
                valA = a.year || 0;
                valB = b.year || 0;
            } else {
                valA = a[sortKey] as string;
                valB = b[sortKey] as string;
            }
            
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return docs;
    }, [initialDocuments, searchQuery, sortKey, sortDirection]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };
    
    const handleDeleteDocument = (id: string, title: string) => {
        // Here you would open a confirmation dialog
        deleteDocument(id).then(() => {
            addToast({ type: 'success', message: `"${title}" deleted successfully.` });
            onDocumentsChange();
        }).catch(err => {
            addToast({ type: 'error', message: 'Failed to delete document.' });
            console.error(err);
        });
    };

    const SortableHeader: React.FC<{ headerKey: SortKey, title: string }> = ({ headerKey, title }) => (
        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
            <button onClick={() => handleSort(headerKey)} className="flex items-center gap-1 group">
                <span>{title}</span>
                {sortKey === headerKey ? (
                    sortDirection === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />
                ) : (
                    <ChevronsUpDownIcon className="text-gray-400 group-hover:text-gray-600" />
                )}
            </button>
        </th>
    );

    return (
        <Card title="Document Management" icon={<DocumentIcon className="h-5 w-5"/>}>
            <div className="relative mb-4">
                <SearchIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
                <input 
                    type="text"
                    placeholder="Search documents by title or author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 shadow-sm focus:border-accent focus:ring focus:ring-accent focus:ring-opacity-50 text-sm pl-10"
                />
            </div>

            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg max-h-[500px]">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                        <tr>
                            <SortableHeader headerKey="title" title="Title" />
                            <SortableHeader headerKey="authors" title="Authors" />
                            <SortableHeader headerKey="year" title="Year" />
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedAndFilteredDocuments.map(doc => (
                            <tr key={doc.id}>
                                <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 max-w-xs truncate" title={doc.title}>{doc.title}</td>
                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate" title={doc.authors.join(', ')}>{doc.authors.join(', ')}</td>
                                <td className="px-4 py-3 text-sm">{doc.year || 'N/A'}</td>
                                <td className="px-4 py-3 text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => onViewPdf(doc)} className="p-1 text-gray-500 hover:text-accent" title="View PDF"><EyeIcon className="h-4 w-4" /></button>
                                        <button 
                                            onClick={() => handleDeleteDocument(doc.id, doc.title)}
                                            disabled={currentUser?.role === 'trial'}
                                            className="p-1 text-gray-500 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                                            aria-label={`Delete ${doc.title}`}
                                            title="Delete document"
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};