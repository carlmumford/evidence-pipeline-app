
import React, { useState } from 'react';
import { SearchIcon, LoadingSpinner } from '../constants';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full rounded-lg shadow-lg overflow-hidden border border-base-300 dark:border-dark-base-300 focus-within:ring-2 focus-within:ring-brand-accent">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for terms like 'zero tolerance', 'restorative justice'..."
        className="w-full px-4 py-3 bg-base-100 dark:bg-dark-base-100 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none"
        disabled={isLoading}
      />
      <button
        type="submit"
        className="flex items-center justify-center px-4 md:px-6 py-3 bg-brand-primary text-white font-semibold hover:bg-brand-secondary transition-colors duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
        disabled={isLoading}
      >
        {isLoading ? <LoadingSpinner /> : <SearchIcon className="h-6 w-6" />}
        <span className="hidden md:inline ml-2">Search</span>
      </button>
    </form>
  );
};
