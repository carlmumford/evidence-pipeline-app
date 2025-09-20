import React from 'react';

interface AISuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  isLoading: boolean;
}

export const AISuggestions: React.FC<AISuggestionsProps> = ({ suggestions, onSuggestionClick, isLoading }) => {
  const shouldRender = isLoading || suggestions.length > 0;
  
  if (!shouldRender) {
    return null;
  }
  
  return (
    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">AI Suggestions</h3>
      {isLoading && suggestions.length === 0 ? (
        <div className="flex flex-wrap gap-2 animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-32"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-40"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full w-28"></div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion)}
              className="px-3 py-1.5 bg-white text-accent dark:bg-gray-900 dark:text-accent-light text-sm font-medium rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};