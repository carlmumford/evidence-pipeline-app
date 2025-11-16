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
    <form onSubmit={(e) => e.preventDefault()} className="flex w-full group">
      <div className="relative w-full">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <SearchIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder="Search evidence by keyword, author, or title..."
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