import React from 'react';
import { AdminIcon } from '../constants';

interface HeaderProps {
    isLoggedIn: boolean;
    onLogout: () => void;
    view: 'main' | 'admin';
    setView: (view: 'main' | 'admin') => void;
}

export const Header: React.FC<HeaderProps> = ({ isLoggedIn, onLogout, view, setView }) => {
  return (
    <header className="bg-base-100 dark:bg-dark-base-300 shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold text-brand-primary dark:text-white">
          The School to Prison Pipeline Evidence Project
        </h1>
        {isLoggedIn && (
            <div className="flex items-center gap-2">
                 {view === 'main' ? (
                     <button
                        onClick={() => setView('admin')}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-brand-primary text-white font-semibold rounded-lg shadow-md hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-opacity-75 transition-colors"
                    >
                        <AdminIcon />
                        Admin Panel
                    </button>
                 ) : (
                    <button
                        onClick={() => setView('main')}
                        className="px-3 py-2 text-sm bg-base-200 dark:bg-dark-base-100 text-slate-700 dark:text-slate-200 font-semibold rounded-lg hover:bg-base-300 dark:hover:bg-dark-base-200 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-opacity-75 transition-colors"
                    >
                        Return to App
                    </button>
                 )}
                <button
                    onClick={onLogout}
                    className="px-3 py-2 text-sm text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-base-200 dark:hover:bg-dark-base-200 transition-colors"
                >
                    Logout
                </button>
            </div>
        )}
      </div>
    </header>
  );
};