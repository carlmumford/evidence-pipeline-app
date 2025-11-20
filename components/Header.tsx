import React from 'react';
import { AdminIcon, Logo, SunIcon, MoonIcon } from '../constants';

interface HeaderProps {
    isLoggedIn: boolean;
    onLogout: () => void;
    view: 'main' | 'admin';
    setView: (view: 'main' | 'admin') => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ isLoggedIn, onLogout, view, setView, theme, toggleTheme }) => {
  return (
    <header className="glass sticky top-0 z-50 transition-all duration-300">
      <div className="container mx-auto px-4 md:px-6 h-16 md:h-20 flex justify-between items-center">
        <button onClick={() => setView('main')} className="hover:opacity-80 transition-opacity focus:outline-none group">
            <Logo className="" imgClassName="h-10 md:h-12 w-auto transform transition-transform group-hover:scale-105 duration-300" />
        </button>
        
        <div className="flex items-center gap-3 md:gap-6">
            <button
                onClick={toggleTheme}
                className="p-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 hover:rotate-12"
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
                {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
            </button>
            
            {isLoggedIn && (
                <div className="flex items-center gap-4 pl-4 border-l border-gray-200 dark:border-gray-700/50">
                    {view === 'main' ? (
                        <button
                            onClick={() => setView('admin')}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-900 dark:bg-white dark:text-gray-900 rounded-full shadow-lg shadow-gray-900/10 hover:shadow-xl hover:scale-105 transition-all duration-300"
                        >
                            <AdminIcon className="h-4 w-4" />
                            <span className="hidden md:inline">Admin Panel</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => setView('main')}
                            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-accent dark:hover:text-accent transition-colors"
                        >
                            Exit Admin
                        </button>
                    )}
                    <button
                        onClick={onLogout}
                        className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};