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
        <div className="min-h-screen bg-white dark:bg-gray-900 flex justify-center items-center">
            <LoadingSpinner className="h-10 w-10 text-gray-400"/>
        </div>
      );
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
      <Header 
        isLoggedIn={isLoggedIn} 
        onLogout={handleLogout} 
        view={view}
        setView={setView}
      />
      <main>
        {view === 'admin' ? <div className="container mx-auto p-4 md:p-8"><AdminPanel /></div> : <MainApp />}
      </main>
    </div>
  );
};

export default App;