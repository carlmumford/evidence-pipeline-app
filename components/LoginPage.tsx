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

  const inputClasses = "w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-accent";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <Logo className="justify-center mb-8" />
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-10 border border-gray-200 dark:border-gray-700">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
              Administrator Login
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Access the project management panel.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="username" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={inputClasses}
                required
                autoCapitalize="none"
              />
            </div>
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClasses}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-accent hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:bg-gray-400"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
        <p className="text-center text-xs text-gray-500 mt-6">
            Default credentials are admin / admin
        </p>
      </div>
    </div>
  );
};

export default LoginPage;