import React, { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { getDocuments, deleteDocument, addDocument } from '../services/documentService';
import { findRecentResearch } from '../services/geminiService';
import type { Document, User, DiscoveredResearch } from '../types';
import { LoadingSpinner, TrashIcon, UserGroupIcon, SparklesIcon, PlusCircleIcon, LinkIcon, CheckCircleIcon } from '../constants';

const AdminPanel: React.FC = () => {
  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });

  // Document Management State
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);
  const [docError, setDocError] = useState<string | null>(null);

  // User Management State
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'editor'>('editor');
  const [userMessage, setUserMessage] = useState({ type: '', text: '' });

  // AI Discovery State
  const [discoveredResearch, setDiscoveredResearch] = useState<DiscoveredResearch[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [addedDocUrls, setAddedDocUrls] = useState<Set<string>>(new Set());
  const [discoveryMessage, setDiscoveryMessage] = useState({ type: '', text: '' });

  const fetchAdminData = useCallback(async () => {
    setIsLoadingDocs(true);
    setDocError(null);
    try {
      const docs = await getDocuments();
      setDocuments(docs);
      const currentUsers = authService.getUsers();
      setUsers(currentUsers);
    } catch (error) {
      setDocError('Failed to load documents.');
      console.error(error);
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });
    const currentUser = authService.getCurrentUser();

    if (!currentUser) {
        setPasswordMessage({ type: 'error', text: 'Could not identify current user.' });
        return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    const result = authService.changePassword(currentUser.username, currentPassword, newPassword);
    if (result.success) {
      setPasswordMessage({ type: 'success', text: result.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordMessage({ type: 'error', text: result.message });
    }
    setTimeout(() => setPasswordMessage({ type: '', text: ''}), 5000);
  };

  const handleDeleteDocument = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      try {
        await deleteDocument(id);
        setDocuments(docs => docs.filter(doc => doc.id !== id));
      } catch (error) {
        alert('Failed to delete document. Please try again.');
        console.error(error);
      }
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserMessage({ type: '', text: '' });
    const result = authService.addUser({ 
        username: newUsername, 
        password: newUserPassword, 
        role: newUserRole 
    });

    if (result.success) {
        setUserMessage({ type: 'success', text: result.message });
        setUsers(authService.getUsers());
        setNewUsername('');
        setNewUserPassword('');
        setNewUserRole('editor');
    } else {
        setUserMessage({ type: 'error', text: result.message });
    }
    setTimeout(() => setUserMessage({ type: '', text: ''}), 5000);
  };
  
  const handleDeleteUser = (username: string) => {
    if (window.confirm(`Are you sure you want to delete the user "${username}"?`)) {
        const result = authService.deleteUser(username);
        if (result.success) {
            setUsers(authService.getUsers());
        } else {
            alert(result.message);
        }
    }
  };
  
  const handleFindResearch = async () => {
      setIsDiscovering(true);
      setDiscoveryError(null);
      setDiscoveredResearch([]);
      setDiscoveryMessage({ type: '', text: '' });
      try {
          const results = await findRecentResearch();
          setDiscoveredResearch(results);
      } catch (err) {
          setDiscoveryError('Failed to retrieve research. The AI may be busy or an error occurred.');
          console.error(err);
      } finally {
          setIsDiscovering(false);
      }
  };

  const handleAddDiscoveredResearch = async (research: DiscoveredResearch) => {
      const isDuplicate = documents.some(doc => doc.title.trim().toLowerCase() === research.title.trim().toLowerCase());
      if (isDuplicate) {
          setDiscoveryMessage({ type: 'error', text: `"${research.title}" already exists in the library.`});
          setTimeout(() => setDiscoveryMessage({ type: '', text: ''}), 5000);
          return;
      }

      const newDoc: Omit<Document, 'id' | 'createdAt'> = {
          title: research.title,
          authors: research.authors.split(',').map(a => a.trim()).filter(Boolean),
          summary: research.summary,
          pdfUrl: research.url,
          // AI doesn't provide these, so we leave them blank for manual entry later if needed
          resourceType: 'Discovered Article',
          year: new Date().getFullYear(), // Assume current year for recency
          subjects: ['newly discovered'],
          simplifiedSummary: '',
          interventions: [],
          keyPopulations: [],
          riskFactors: [],
          keyStats: [],
          keyOrganizations: [],
          publicationTitle: ''
      };

      try {
          await addDocument(newDoc);
          setAddedDocUrls(prev => new Set(prev).add(research.url));
          setDiscoveryMessage({ type: 'success', text: `Successfully added "${research.title}".`});
          fetchAdminData(); // Refresh the main documents list
          setTimeout(() => setDiscoveryMessage({ type: '', text: ''}), 5000);
      } catch (error) {
          setDiscoveryMessage({ type: 'error', text: 'Failed to add the document to the database.'});
          console.error(error);
          setTimeout(() => setDiscoveryMessage({ type: '', text: ''}), 5000);
      }
  };

  const getConfidenceColor = (score: number) => {
    if (score > 85) return 'text-green-500';
    if (score > 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-brand-primary dark:text-brand-accent mb-2">Administrator Panel</h2>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Manage application settings and content.
        </p>
      </div>

      {/* AI Research Discovery Section */}
      <section className="bg-base-100 dark:bg-dark-base-300 p-6 rounded-lg shadow-md border border-base-300 dark:border-slate-700">
        <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <SparklesIcon /> AI Research Discovery
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Use AI to search the web for the latest research on the school-to-prison pipeline from reputable sources.
        </p>
        <button 
            onClick={handleFindResearch} 
            disabled={isDiscovering}
            className="flex items-center justify-center px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-secondary disabled:bg-slate-400 disabled:cursor-wait"
        >
            {isDiscovering ? <LoadingSpinner /> : <SparklesIcon />}
            <span className="ml-2">{isDiscovering ? 'Searching...' : 'Find Recent Research'}</span>
        </button>

        {discoveryMessage.text && (
            <div className={`mt-4 p-3 rounded-md text-sm ${discoveryMessage.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                {discoveryMessage.text}
            </div>
        )}

        {isDiscovering && (
            <div className="mt-4 text-center">
                <p className="text-slate-500">AI is searching the internet. This may take a moment...</p>
            </div>
        )}

        {discoveryError && <p className="mt-4 text-red-500">{discoveryError}</p>}
        
        {discoveredResearch.length > 0 && (
            <div className="mt-6 space-y-4">
                {discoveredResearch.map((item, index) => (
                    <div key={index} className="p-4 border border-base-300 dark:border-slate-700 rounded-lg bg-base-200/50 dark:bg-dark-base-200/50">
                        <div className="flex justify-between items-start">
                           <div>
                             <h4 className="font-bold text-brand-primary dark:text-brand-accent">{item.title}</h4>
                             <p className="text-xs font-mono text-slate-500">{item.authors}</p>
                           </div>
                           <div className="text-center ml-4 flex-shrink-0">
                                <p className={`text-2xl font-bold ${getConfidenceColor(item.confidenceScore)}`}>{item.confidenceScore}</p>
                                <p className="text-xs text-slate-500">Confidence</p>
                           </div>
                        </div>
                        <p className="text-sm my-3 text-slate-600 dark:text-slate-400">{item.summary}</p>
                        
                        {item.sources && item.sources.length > 0 && (
                           <div className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                <h5 className="font-semibold">Sources found by AI:</h5>
                                <ul className="list-disc list-inside">
                                    {item.sources.map(source => (
                                        <li key={source.uri}><a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:underline text-brand-primary">{source.title || source.uri}</a></li>
                                    ))}
                                </ul>
                           </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-brand-primary hover:underline">
                                <LinkIcon className="h-4 w-4" /> View Source
                            </a>
                            <button
                                onClick={() => handleAddDiscoveredResearch(item)}
                                disabled={addedDocUrls.has(item.url)}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors bg-green-500 text-white hover:bg-green-600 disabled:bg-slate-400 disabled:cursor-not-allowed"
                            >
                                {addedDocUrls.has(item.url) ? <CheckCircleIcon className="h-5 w-5" /> : <PlusCircleIcon className="h-5 w-5" />}
                                {addedDocUrls.has(item.url) ? 'Added' : 'Add to Database'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </section>

      {/* User Management Section */}
      <section className="bg-base-100 dark:bg-dark-base-300 p-6 rounded-lg shadow-md border border-base-300 dark:border-slate-700">
        <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <UserGroupIcon /> User Management
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Add User Form */}
            <div>
                <h4 className="font-semibold mb-3">Add New User</h4>
                <form onSubmit={handleAddUser} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="new-username">Username</label>
                        <input type="text" id="new-username" value={newUsername} onChange={e => setNewUsername(e.target.value)} required className="w-full input-style" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="new-user-password">Password</label>
                        <input type="password" id="new-user-password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} required className="w-full input-style" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1" htmlFor="new-user-role">Role</label>
                        <select id="new-user-role" value={newUserRole} onChange={e => setNewUserRole(e.target.value as 'admin' | 'editor')} className="w-full input-style">
                            <option value="editor">Editor</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                     {userMessage.text && (
                        <div className={`p-3 rounded-md text-sm ${userMessage.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                            {userMessage.text}
                        </div>
                    )}
                    <div className="text-right">
                        <button type="submit" className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-secondary">
                        Add User
                        </button>
                    </div>
                </form>
            </div>
            {/* User List */}
            <div>
                 <h4 className="font-semibold mb-3">Existing Users</h4>
                 <div className="overflow-x-auto max-h-72">
                    <table className="min-w-full divide-y divide-base-300 dark:divide-slate-700">
                    <thead className="bg-base-200 dark:bg-dark-base-200 sticky top-0">
                        <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Username</th>
                        <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Role</th>
                        <th className="relative px-4 py-2"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-base-100 dark:bg-dark-base-300 divide-y divide-base-200 dark:divide-slate-800">
                        {users.map(user => (
                        <tr key={user.username}>
                            <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">{user.username}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 capitalize">{user.role}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                                onClick={() => handleDeleteUser(user.username)}
                                disabled={user.username.toLowerCase() === 'admin'}
                                className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 disabled:opacity-30 disabled:cursor-not-allowed"
                                aria-label={`Delete ${user.username}`}
                            >
                                <TrashIcon />
                            </button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                 </div>
            </div>
        </div>
      </section>

      {/* Change Password Section */}
      <section className="bg-base-100 dark:bg-dark-base-300 p-6 rounded-lg shadow-md border border-base-300 dark:border-slate-700">
        <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Change Your Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="current-password">Current Password</label>
            <input type="password" id="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="w-full input-style" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="new-password">New Password</label>
            <input type="password" id="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full input-style" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="confirm-password">Confirm New Password</label>
            <input type="password" id="confirm-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full input-style" />
          </div>
          {passwordMessage.text && (
            <div className={`p-3 rounded-md text-sm ${passwordMessage.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
              {passwordMessage.text}
            </div>
          )}
          <div className="text-right">
            <button type="submit" className="px-4 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-sm hover:bg-brand-secondary">
              Update Password
            </button>
          </div>
        </form>
      </section>

      {/* Document Management Section */}
      <section className="bg-base-100 dark:bg-dark-base-300 p-6 rounded-lg shadow-md border border-base-300 dark:border-slate-700">
        <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Manage Documents</h3>
        {isLoadingDocs ? (
          <div className="flex justify-center items-center p-8">
            <LoadingSpinner className="h-8 w-8 text-brand-primary" />
            <span className="ml-3">Loading documents...</span>
          </div>
        ) : docError ? (
          <p className="text-red-500 text-center">{docError}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-base-300 dark:divide-slate-700">
              <thead className="bg-base-200 dark:bg-dark-base-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Authors</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Year</th>
                  <th className="relative px-4 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-base-100 dark:bg-dark-base-300 divide-y divide-base-200 dark:divide-slate-800">
                {documents.map(doc => (
                  <tr key={doc.id}>
                    <td className="px-4 py-4 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">{doc.title}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate">{doc.authors.join(', ')}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm">{doc.year || 'N/A'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => handleDeleteDocument(doc.id, doc.title)}
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400 p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20"
                        aria-label={`Delete ${doc.title}`}
                      >
                        <TrashIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <style>{`.input-style { background-color: #F5F5F5; border: 1px solid #E0E0E0; border-radius: 0.375rem; padding: 0.5rem 0.75rem; } .dark .input-style { background-color: #1E1E1E; border-color: #2C2C2C; }`}</style>
    </div>
  );
};

export default AdminPanel;