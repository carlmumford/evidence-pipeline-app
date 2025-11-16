import React, { useMemo } from 'react';
import type { Document, User } from '../../types';
import { Card } from './shared/Card';
// FIX: Import ChartBarIcon to resolve reference error.
import { DocumentIcon, UserGroupIcon, UploadIcon, ChartBarIcon } from '../../constants';

interface AdminDashboardSummaryProps {
  documents: Document[];
  users: User[];
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
        <div className="p-3 rounded-full bg-accent-light text-accent dark:bg-accent/20">
            {icon}
        </div>
        <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
    </div>
);

export const AdminDashboardSummary: React.FC<AdminDashboardSummaryProps> = ({ documents, users }) => {
  const latestUpload = useMemo(() => {
    if (documents.length === 0) return 'N/A';
    const sortedDocs = [...documents].sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    return sortedDocs[0].createdAt.toDate().toLocaleDateString('en-GB');
  }, [documents]);

  return (
    <Card title="Dashboard" icon={<ChartBarIcon className="h-5 w-5" />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Total Documents" value={documents.length} icon={<DocumentIcon className="h-6 w-6" />} />
            <StatCard title="Total Users" value={users.length} icon={<UserGroupIcon className="h-6 w-6" />} />
            <StatCard title="Latest Upload" value={latestUpload} icon={<UploadIcon className="h-6 w-6" />} />
        </div>
    </Card>
  );
};