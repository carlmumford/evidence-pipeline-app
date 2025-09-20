import React from 'react';
import { AdminIcon, Logo } from '../constants';

interface HeaderProps {
    isLoggedIn: boolean;
    onLogout: () => void;
    view: 'main' | 'admin';
    setView: (view: 'main' | 'admin') => void;
}

export const Header: React.FC<HeaderProps> = ({ isLoggedIn, onLogout, view, setView }) => {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-8 h-16 flex justify-between items-center">
        <Logo />
        {isLoggedIn && (
            <div className="flex items-center gap-4">
                 {view === 'main' ? (
                     <button
                        onClick={() => setView('admin')}
                        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                        <AdminIcon className="h-4 w-4" />
                        <span>Admin Panel</span>
                    </button>
                 ) : (
                    <button
                        onClick={() => setView('main')}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                        &larr; Return to App
                    </button>
                 )}
                <button
                    onClick={onLogout}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                    Logout
                </button>
            </div>
        )}
      </div>
    </header>
  );
};
