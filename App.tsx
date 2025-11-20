import React, { useState, useEffect, Suspense, lazy, useLayoutEffect } from 'react';
import { authService } from './services/authService';
import { Header } from './components/Header';
import { LoadingSpinner } from './constants';
import { ToastProvider } from './contexts/ToastContext';

const LoginPage = lazy(() => import('./components/LoginPage'));
const MainApp = lazy(() => import('./components/MainApp'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(authService.isLoggedIn());
  const [view, setView] = useState<'main' | 'admin'>('main');
  const [isInitializing, setIsInitializing] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme : 'light';
  });

  useLayoutEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    setIsLoggedIn(authService.isLoggedIn());
    setIsInitializing(false);

    const handleStorage = (event: StorageEvent) => {
        if (event.key === 'theme' && (event.newValue === 'light' || event.newValue === 'dark')) {
            setTheme(event.newValue);
        }
        setIsLoggedIn(authService.isLoggedIn());
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setView('admin');
  };

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
    setView('main');
  };

  if (isInitializing) {
      return (
        <div className="min-h-screen bg-white dark:bg-gray-900 flex justify-center items-center">
            <LoadingSpinner className="h-10 w-10 text-gray-400"/>
        </div>
      );
  }

  const suspenseFallback = (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex justify-center items-center">
        <LoadingSpinner className="h-10 w-10 text-gray-400"/>
    </div>
  );

  if (!isLoggedIn) {
    return (
        <Suspense fallback={suspenseFallback}>
            <LoginPage onLogin={handleLogin} />
        </Suspense>
    );
  }

  return (
    <ToastProvider>
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
        <Header 
            isLoggedIn={isLoggedIn} 
            onLogout={handleLogout} 
            view={view}
            setView={setView}
            theme={theme}
            toggleTheme={toggleTheme}
        />
        <main>
            <Suspense fallback={
                <div className="flex justify-center items-center p-8 min-h-[calc(100vh-4rem)]">
                    <LoadingSpinner className="h-8 w-8 text-accent" />
                </div>
            }>
                {view === 'admin' ? <AdminPanel /> : <MainApp />}
            </Suspense>
        </main>
        </div>
    </ToastProvider>
  );
};

export default App;