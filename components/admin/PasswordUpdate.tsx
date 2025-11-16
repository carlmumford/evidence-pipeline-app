import React, { useState, useMemo } from 'react';
import { Card } from './shared/Card';
import { KeyIcon } from '../../constants';
import { authService } from '../../services/authService';
import { useToast } from '../../contexts/ToastContext';

export const PasswordUpdate: React.FC = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { addToast } = useToast();

    const getPasswordStrength = (password: string) => {
        let score = 0;
        if (password.length > 8) score++;
        if (password.match(/[a-z]/)) score++;
        if (password.match(/[A-Z]/)) score++;
        if (password.match(/[0-9]/)) score++;
        if (password.match(/[^a-zA-Z0-9]/)) score++;
        return score;
    };

    const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);
    const strengthColors = ['bg-red-500', 'bg-red-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500', 'bg-green-500'];

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        const currentUser = authService.getCurrentUser();

        if (!currentUser) {
            addToast({ type: 'error', message: 'Could not identify current user.' });
            return;
        }

        if (newPassword !== confirmPassword) {
            addToast({ type: 'error', message: 'New passwords do not match.' });
            return;
        }

        const result = authService.changePassword(currentUser.username, currentPassword, newPassword);
        if (result.success) {
            addToast({ type: 'success', message: result.message });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            addToast({ type: 'error', message: result.message });
        }
    };

    const inputClasses = "block w-full rounded-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 shadow-sm focus:border-accent focus:ring focus:ring-accent focus:ring-opacity-50 text-sm";

    return (
        <Card title="Change Your Password" icon={<KeyIcon />}>
            <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="current-password">Current Password</label>
                    <input type="password" id="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className={inputClasses} />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="new-password">New Password</label>
                    <input type="password" id="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className={inputClasses} />
                    {newPassword.length > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${strengthColors[strength]}`} style={{ width: `${(strength / 5) * 100}%` }}></div>
                            </div>
                            <span className="text-xs text-gray-500 whitespace-nowrap">{['Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Strong'][strength]}</span>
                        </div>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1" htmlFor="confirm-password">Confirm New Password</label>
                    <input type="password" id="confirm-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={inputClasses} />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Password must be at least 8 characters long and should include a mix of letters, numbers, and symbols.
                </p>
                <div className="text-right">
                    <button type="submit" className="px-4 py-2 bg-accent text-white font-semibold rounded-lg shadow-sm hover:bg-accent-hover">
                    Update Password
                    </button>
                </div>
            </form>
        </Card>
    );
};
