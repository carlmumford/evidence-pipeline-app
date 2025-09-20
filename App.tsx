import React, { useState, useEffect } from 'react';
import { authService } from './services/authService';
import LoginPage from './components/LoginPage';
import MainApp from './components/MainApp';
import AdminPanel from './components/AdminPanel';
import { Header } from './components/Header';
import { LoadingSpinner } from './constants';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(authService.isLoggedIn());
  const [view, setView] = useState<'main' | 'admin'>('main');
  const [isInitializing, setIsInitializing] = useState(true);

  // A brief delay to prevent UI flash on load
  useEffect(() => {
    setTimeout(() => {
        setIsLoggedIn(authService.isLoggedIn());
        setIsInitializing(false);
    }, 200);
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
        <div className="min-h-screen bg-base-200 dark:bg-dark-base-200 flex justify-center items-center">
            <LoadingSpinner className="h-12 w-12 text-brand-primary dark:text-brand-accent"/>
        </div>
      );
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-base-200 dark:bg-dark-base-200 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-300">
      <Header 
        isLoggedIn={isLoggedIn} 
        onLogout={handleLogout} 
        view={view}
        setView={setView}
      />
      <main className="container mx-auto p-4 md:p-8">
        {view === 'admin' ? <AdminPanel /> : <MainApp />}
      </main>
    </div>
  );
};

export default App;