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

  const inputClasses = "w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 rounded-xl border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md animate-fade-in-up">
        <div className="flex justify-center mb-8">
             <Logo className="transform hover:scale-105 transition-transform duration-300" imgClassName="h-20 w-auto drop-shadow-sm" />
        </div>
        
        <div className="glass-panel rounded-3xl p-8 md:p-12">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Welcome Back
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
              Sign in to access the evidence dashboard and admin tools.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label 
                htmlFor="username" 
                className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide ml-1"
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
                placeholder="Enter your username"
              />
            </div>
            <div className="space-y-1">
              <label 
                htmlFor="password" 
                className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide ml-1"
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
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-sm text-center animate-bounce-slight">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-accent/20 text-sm font-bold text-white bg-accent hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:bg-gray-400 disabled:shadow-none transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
                disabled={isLoading}
              >
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing In...
                    </span>
                ) : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
        
        <p className="text-center mt-8 text-xs text-gray-400 dark:text-gray-500">
            &copy; {new Date().getFullYear()} School-to-Prison Pipeline Evidence Project
        </p>
      </div>
    </div>
  );
};

export default LoginPage;