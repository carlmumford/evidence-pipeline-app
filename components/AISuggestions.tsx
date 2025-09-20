
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
    <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <h3 className="text-lg font-semibold text-brand-primary dark:text-brand-accent mb-3">AI Suggestions</h3>
      {isLoading && suggestions.length === 0 ? (
        <div className="flex flex-wrap gap-2 animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-full w-32"></div>
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-full w-40"></div>
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-full w-28"></div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion)}
              className="px-4 py-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-sm font-medium rounded-full hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-200"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
