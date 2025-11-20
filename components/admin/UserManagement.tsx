import React, { useState, useMemo } from 'react';
import type { User } from '../../types';
import { Card } from './shared/Card';
import { UserGroupIcon, TrashIcon, EditIcon, SearchIcon } from '../../constants';
import { authService } from '../../services/authService';
import { useToast } from '../../contexts/ToastContext';

interface UserManagementProps {
  initialUsers: User[];
  onUsersChange: () => Promise<void>;
}

export const UserManagement: React.FC<UserManagementProps> = ({ initialUsers, onUsersChange }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<'admin' | 'editor' | 'trial'>('editor');
    const { addToast } = useToast();

    const filteredUsers = useMemo(() => {
        return initialUsers.filter(user =>
            user.username.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [initialUsers, searchQuery]);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await authService.addUser({
            username: newUsername,
            password: newUserPassword,
            role: newUserRole
        });

        if (result.success) {
            addToast({ type: 'success', message: result.message });
            await onUsersChange(); // Notify parent to refetch users
            setNewUsername('');
            setNewUserPassword('');
            setNewUserRole('editor');
        } else {
            addToast({ type: 'error', message: result.message });
        }
    };
  
    const handleDeleteUser = async (username: string) => {
        // Here you would open a confirmation dialog
        const result = await authService.deleteUser(username);
        if (result.success) {
            addToast({ type: 'success', message: 'User deleted successfully.' });
            await onUsersChange();
        } else {
            addToast({ type: 'error', message: result.message });
        }
    };

    const inputClasses = "block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 shadow-sm focus:border-accent focus:ring focus:ring-accent focus:ring-opacity-50 text-sm";
    
    return (
        <Card title="User Management" icon={<UserGroupIcon />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Add User Form */}
                <div className="md:col-span-1">
                    <h4 className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Add New User</h4>
                    <form onSubmit={handleAddUser} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" htmlFor="new-username">Username</label>
                            <input type="text" id="new-username" value={newUsername} onChange={e => setNewUsername(e.target.value)} required className={inputClasses} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" htmlFor="new-user-password">Password</label>
                            <input type="password" id="new-user-password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} required className={inputClasses} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" htmlFor="new-user-role">Role</label>
                            <select id="new-user-role" value={newUserRole} onChange={e => setNewUserRole(e.target.value as 'admin' | 'editor' | 'trial')} className={inputClasses}>
                                <option value="editor">Editor</option>
                                <option value="admin">Admin</option>
                                <option value="trial">Trial</option>
                            </select>
                        </div>
                        <div className="text-right pt-2">
                            <button type="submit" className="w-full px-4 py-2 bg-accent text-white font-semibold rounded-lg shadow-sm hover:bg-accent-hover">
                            Add User
                            </button>
                        </div>
                    </form>
                </div>

                {/* User List */}
                <div className="md:col-span-2">
                     <div className="relative mb-4">
                        <SearchIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 -translate-y-1/2" />
                        <input 
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`${inputClasses} pl-10`}
                        />
                     </div>
                     <div className="overflow-x-auto max-h-96 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Username</th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Role</th>
                                <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredUsers.map(user => (
                            <tr key={user.username}>
                                <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-800 dark:text-gray-200">{user.username}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 capitalize">{user.role}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                    <div className="flex items-center gap-2">
                                        <button className="p-1 text-gray-500 hover:text-accent disabled:opacity-50" title="Edit user (coming soon)" disabled><EditIcon className="h-4 w-4" /></button>
                                        <button 
                                            onClick={() => handleDeleteUser(user.username)}
                                            disabled={user.username.toLowerCase() === 'admin'}
                                            className="p-1 text-gray-500 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                                            aria-label={`Delete ${user.username}`}
                                            title="Delete user"
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
                </div>
            </div>
        </Card>
    );
};