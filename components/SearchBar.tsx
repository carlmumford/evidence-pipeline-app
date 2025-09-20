import React, { useState, useEffect } from 'react';
import { SearchIcon, LoadingSpinner } from '../constants';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  initialQuery?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading, initialQuery = '' }) => {
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
      setQuery(initialQuery);
  }, [initialQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full group">
      <div className="relative w-full">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for terms like 'zero tolerance', 'restorative justice'..."
            className="w-full pl-11 pr-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-md border border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
            disabled={isLoading}
        />
        {isLoading && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                <LoadingSpinner className="h-5 w-5 text-gray-400" />
            </div>
        )}
      </div>
    </form>
  );
};