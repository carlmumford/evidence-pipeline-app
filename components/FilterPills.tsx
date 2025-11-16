import React from 'react';
import type { Filters } from '../types';
import { CloseIcon } from '../constants';

interface FilterPillsProps {
  filters: Filters;
  onRemoveFilter: (category: keyof Filters, valueToRemove: string) => void;
  onClearAll: () => void;
}

const formatPillLabel = (category: string, value: string) => {
    const formattedCategory = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    return `${formattedCategory}: ${value}`;
}

const getActiveFilters = (filters: Filters) => {
    const active: { category: keyof Filters | 'year'; value: string, displayValue: string }[] = [];
  
    if (filters.startYear && filters.endYear) {
      active.push({ category: 'year', value: `${filters.startYear}-${filters.endYear}`, displayValue: `${filters.startYear} - ${filters.endYear}` });
    } else if (filters.startYear) {
      active.push({ category: 'year', value: `from-${filters.startYear}`, displayValue: `From ${filters.startYear}` });
    } else if (filters.endYear) {
      active.push({ category: 'year', value: `upto-${filters.endYear}`, displayValue: `Up to ${filters.endYear}` });
    }
  
    (Object.keys(filters) as Array<keyof Filters>).forEach(key => {
      if (key !== 'startYear' && key !== 'endYear') {
        const values = filters[key];
        if (Array.isArray(values)) {
          values.forEach(value => {
            active.push({ category: key, value, displayValue: value });
          });
        }
      }
    });
  
    return active;
};

export const FilterPills: React.FC<FilterPillsProps> = ({ filters, onRemoveFilter, onClearAll }) => {
  const activeFilters = getActiveFilters(filters);

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="px-4 md:px-6 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">Active Filters:</span>
            {activeFilters.map(({ category, value, displayValue }) => (
                <div key={`${category}-${value}`} className="flex items-center gap-1.5 bg-accent-light text-accent dark:bg-accent/20 dark:text-accent-light px-2.5 py-1 rounded-full text-sm font-medium">
                    <span className="capitalize">{formatPillLabel(category, displayValue)}</span>
                    <button
                        onClick={() => {
                            if (category === 'year') {
                                onRemoveFilter('startYear', '');
                                onRemoveFilter('endYear', '');
                            } else {
                                onRemoveFilter(category as keyof Filters, value);
                            }
                        }}
                        className="p-0.5 rounded-full hover:bg-accent/20 dark:hover:bg-accent/40"
                        aria-label={`Remove filter ${displayValue}`}
                    >
                        <CloseIcon className="h-3.5 w-3.5" />
                    </button>
                </div>
            ))}
            <button onClick={onClearAll} className="ml-2 text-sm text-accent hover:underline">
                Clear all
            </button>
        </div>
    </div>
  );
};