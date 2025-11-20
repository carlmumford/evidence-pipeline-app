import React, { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { getDocuments } from '../services/documentService';
import type { Document, User } from '../types';
import { LoadingSpinner } from '../constants';
import { PDFViewerModal } from './PDFViewerModal';
import { AdminDashboardSummary } from './admin/AdminDashboardSummary';
import { AIResearchDiscovery } from './admin/AIResearchDiscovery';
import { PasswordUpdate } from './admin/PasswordUpdate';
import { UserManagement } from './admin/UserManagement';
import { DocumentManagement } from './admin/DocumentManagement';

const AdminPanel: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<Document | null>(null);

  const fetchAdminData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [docs, currentUsers] = await Promise.all([
        getDocuments(),
        authService.getUsers()
      ]);
      setDocuments(docs);
      setUsers(currentUsers);
    } catch (error) {
      setError('Failed to load administrative data. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handleUsersChange = useCallback(async () => {
      const latestUsers = await authService.getUsers();
      setUsers(latestUsers);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8 min-h-[calc(100vh-4rem)]">
        <LoadingSpinner className="h-8 w-8 text-accent" />
        <span className="ml-3 text-lg">Loading Admin Panel...</span>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-center py-20">{error}</p>;
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">
            <header className="text-center md:text-left">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">Administrator Panel</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                Manage application settings and content.
                </p>
            </header>

            <AdminDashboardSummary documents={documents} users={users} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <AIResearchDiscovery existingDocs={documents} onDocumentAdded={fetchAdminData} />
                <PasswordUpdate />
            </div>

            <UserManagement initialUsers={users} onUsersChange={handleUsersChange} />
            <DocumentManagement initialDocuments={documents} onDocumentsChange={fetchAdminData} onViewPdf={setPdfDoc} />
        </div>

        <PDFViewerModal 
            isOpen={!!pdfDoc}
            onClose={() => setPdfDoc(null)}
            document={pdfDoc}
      />
    </div>
  );
};

export default AdminPanel;