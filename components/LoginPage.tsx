import React, { useState } from 'react';
import { authService } from '../services/authService';
import { Logo } from '../constants';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Simulate network delay
    setTimeout(() => {
      const success = authService.login(username, password);
      if (success) {
        onLogin();
      } else {
        setError('Invalid username or password.');
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 dark:bg-dark-base-300 p-4">
      <div className="w-full max-w-md">
        <Logo className="justify-center mb-8" />
        <div className="bg-base-100 dark:bg-dark-base-200 rounded-2xl shadow-2xl p-8 md:p-10 border border-base-300 dark:border-dark-base-100">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              Administrator Login
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Access the project management panel.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="username" 
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-base-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-brand-primary focus:border-brand-primary bg-base-200 dark:bg-dark-base-100"
                required
                autoCapitalize="none"
              />
            </div>
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-base-300 dark:border-slate-700 rounded-lg shadow-sm focus:ring-brand-primary focus:border-brand-primary bg-base-200 dark:bg-dark-base-100"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:bg-slate-400"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
        <p className="text-center text-xs text-slate-500 mt-6">
            Default credentials are admin / admin
        </p>
      </div>
    </div>
  );
};

export default LoginPage;