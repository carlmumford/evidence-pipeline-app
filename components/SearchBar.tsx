import React from 'react';
import { SearchIcon, LoadingSpinner } from '../constants';

interface SearchBarProps {
  onQueryChange: (query: string) => void;
  query: string;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onQueryChange, query, isLoading }) => {
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onQueryChange(e.target.value);
  };

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex w-full group relative z-20 max-w-3xl mx-auto">
      <div className="relative w-full transition-all duration-300 transform group-focus-within:scale-[1.01] group-focus-within:-translate-y-0.5">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-6">
            <SearchIcon className={`h-6 w-6 transition-colors duration-300 ${query ? 'text-accent' : 'text-gray-400 group-focus-within:text-accent'}`} />
        </div>
        <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search evidence by keyword, author, or title..."
            className="block w-full pl-14 pr-12 py-4 text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-full border-2 border-transparent shadow-soft focus:outline-none focus:ring-0 focus:border-accent/30 focus:shadow-glow transition-all duration-300 ease-out"
            disabled={isLoading}
        />
        {isLoading && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-6">
                <LoadingSpinner className="h-6 w-6 text-accent" />
            </div>
        )}
      </div>
    </form>
  );
};