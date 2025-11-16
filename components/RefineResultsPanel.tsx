import React, { useState, useMemo } from 'react';
import type { Document, Filters } from '../types';
import { UploadIcon, ListIcon, ChartBarIcon, ChevronDownIcon, CloseIcon } from '../constants';

interface RefineResultsPanelProps {
  documents: Document[];
  options: {
    resourceTypes: string[];
    subjects: string[];
    interventions: string[];
    keyPopulations: string[];
    riskFactors: string[];
    keyOrganisations: string[];
    mentalHealthConditions: string[];
  };
  filters: Filters;
  onFilterChange: (newFilters: Filters) => void;
  onSetView: (view: 'search' | 'list' | 'data') => void;
  onOpenUpload: () => void;
  savedDocCount: number;
  currentView: 'search' | 'list' | 'data';
  onClose: () => void;
}

const FilterSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
  
    return (
      <div className="py-4">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex justify-between items-center px-4"
            aria-expanded={isOpen}
            aria-controls={`filter-section-${title.replace(/\s+/g, '-')}`}
          >
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{title}</h4>
              <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        
        {isOpen && (
          <div 
            id={`filter-section-${title.replace(/\s+/g, '-')}`}
            className="mt-3 px-4"
          >
            {children}
          </div>
        )}
      </div>
    );
};

const CheckboxFilterGroup: React.FC<{
  items: string[];
  checkedItems: string[];
  onCheckboxChange: (value: string) => void;
  counts: Record<string, number>;
}> = ({ items, checkedItems, onCheckboxChange, counts }) => {
  if (items.length === 0) return <p className="text-sm text-gray-400">No options available</p>;
  return (
    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
      {items.map(item => (
        <label key={item} className="flex items-start space-x-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={checkedItems.includes(item)}
            onChange={() => onCheckboxChange(item)}
            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-accent focus:ring-accent bg-gray-100 dark:bg-gray-800 flex-shrink-0 mt-0.5"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white capitalize">
            {item} <span className="text-gray-400 dark:text-gray-500">({counts[item] || 0})</span>
          </span>
        </label>
      ))}
    </div>
  );
};

const NavButton: React.FC<{
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    isActive: boolean;
    badge?: number;
}> = ({ icon, label, onClick, isActive, badge }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            isActive 
            ? 'bg-accent-light text-accent dark:bg-accent/10 dark:text-white' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
    >
        {icon}
        <span className="flex-grow text-left">{label}</span>
        {badge !== undefined && <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700">{badge}</span>}
    </button>
);


export const RefineResultsPanel: React.FC<RefineResultsPanelProps> = ({ documents, options, filters, onFilterChange, onSetView, onOpenUpload, savedDocCount, currentView, onClose }) => {
  
  const filterCounts = useMemo(() => {
    const counts: { [K in keyof Omit<Filters, 'startYear' | 'endYear'>]?: Record<string, number> } = {};
    
    const countValues = (key: keyof Document, category: keyof typeof counts) => {
        const categoryCounts: Record<string, number> = {};
        documents.forEach(doc => {
            const values = doc[key];
            if (Array.isArray(values)) {
                // Use a Set to count each value only once per document
                new Set(values).forEach(val => {
                    categoryCounts[val] = (categoryCounts[val] || 0) + 1;
                });
            } else if (typeof values === 'string' && values) {
                categoryCounts[values] = (categoryCounts[values] || 0) + 1;
            }
        });
        counts[category] = categoryCounts;
    }

    countValues('resourceType', 'resourceTypes');
    countValues('subjects', 'subjects');
    countValues('interventions', 'interventions');
    countValues('keyPopulations', 'keyPopulations');
    countValues('riskFactors', 'riskFactors');
    countValues('keyOrganisations', 'keyOrganisations');
    countValues('mentalHealthConditions', 'mentalHealthConditions');

    return counts;

  }, [documents]);
  
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    const value = e.target.value;
    onFilterChange({
      ...filters,
      [type === 'start' ? 'startYear' : 'endYear']: value
    });
  };

  const handleCheckboxChange = (category: keyof Omit<Filters, 'startYear' | 'endYear'>, value: string) => {
    const currentValues = filters[category];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(item => item !== value)
      : [...currentValues, value];
    
    onFilterChange({ ...filters, [category]: newValues });
  };

  const hasActiveFilters = 
    Object.values(filters).some(value => Array.isArray(value) ? value.length > 0 : !!value);

  const clearFilters = () => {
    onFilterChange({
        startYear: '',
        endYear: '',
        resourceTypes: [],
        subjects: [],
        interventions: [],
        keyPopulations: [],
        riskFactors: [],
        keyOrganisations: [],
        mentalHealthConditions: [],
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900/50">
        <div className="p-4 space-y-2 border-b border-gray-200 dark:border-gray-800">
            <div className="flex justify-end lg:hidden mb-2">
                <button 
                    onClick={onClose} 
                    className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    aria-label="Close filters"
                >
                    <CloseIcon />
                </button>
            </div>
            <NavButton icon={<UploadIcon />} label="Upload Evidence" onClick={onOpenUpload} isActive={false} />
            <NavButton icon={<ListIcon />} label="My List" onClick={() => onSetView('list')} isActive={currentView === 'list'} badge={savedDocCount}/>
            <NavButton icon={<ChartBarIcon />} label="Data & Insights" onClick={() => onSetView('data')} isActive={currentView === 'data'}/>
        </div>

        <div className="flex-grow overflow-y-auto">
            <div className="flex justify-between items-center p-4">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Filters</h3>
                {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-sm text-accent hover:underline">Clear all</button>
                )}
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-800">
                <FilterSection title="Publication Year" defaultOpen={true}>
                <div className="flex items-center gap-2">
                    <input type="number" placeholder="From" value={filters.startYear} onChange={e => handleYearChange(e, 'start')} className="w-full input-style" />
                    <span className="text-gray-400">-</span>
                    <input type="number" placeholder="To" value={filters.endYear} onChange={e => handleYearChange(e, 'end')} className="w-full input-style" />
                </div>
                </FilterSection>

                {options.riskFactors.length > 0 && <FilterSection title="Risk Factor">
                <CheckboxFilterGroup items={options.riskFactors} checkedItems={filters.riskFactors} onCheckboxChange={(val) => handleCheckboxChange('riskFactors', val)} counts={filterCounts.riskFactors || {}} />
                </FilterSection>}

                {options.mentalHealthConditions.length > 0 && <FilterSection title="Mental Health / Neurodiversity">
                    <CheckboxFilterGroup items={options.mentalHealthConditions} checkedItems={filters.mentalHealthConditions} onCheckboxChange={(val) => handleCheckboxChange('mentalHealthConditions', val)} counts={filterCounts.mentalHealthConditions || {}}/>
                </FilterSection>}

                {options.interventions.length > 0 && <FilterSection title="Intervention">
                    <CheckboxFilterGroup items={options.interventions} checkedItems={filters.interventions} onCheckboxChange={(val) => handleCheckboxChange('interventions', val)} counts={filterCounts.interventions || {}}/>
                </FilterSection>}

                {options.keyPopulations.length > 0 && <FilterSection title="Key Population">
                    <CheckboxFilterGroup items={options.keyPopulations} checkedItems={filters.keyPopulations} onCheckboxChange={(val) => handleCheckboxChange('keyPopulations', val)} counts={filterCounts.keyPopulations || {}}/>
                </FilterSection>}

                {options.keyOrganisations.length > 0 && <FilterSection title="Key Organisation">
                    <CheckboxFilterGroup items={options.keyOrganisations} checkedItems={filters.keyOrganisations} onCheckboxChange={(val) => handleCheckboxChange('keyOrganisations', val)} counts={filterCounts.keyOrganisations || {}}/>
                </FilterSection>}
                
                {options.resourceTypes.length > 0 && <FilterSection title="Resource Type">
                    <CheckboxFilterGroup items={options.resourceTypes} checkedItems={filters.resourceTypes} onCheckboxChange={(val) => handleCheckboxChange('resourceTypes', val)} counts={filterCounts.resourceTypes || {}}/>
                </FilterSection>}

                {options.subjects.length > 0 && <FilterSection title="Subject">
                    <CheckboxFilterGroup items={options.subjects} checkedItems={filters.subjects} onCheckboxChange={(val) => handleCheckboxChange('subjects', val)} counts={filterCounts.subjects || {}}/>
                </FilterSection>}
            </div>
        </div>
       <style>{`.input-style { display: block; width: 100%; border-radius: 0.375rem; border: 1px solid #d4d4d4; padding: 0.5rem 0.75rem; background-color: #fafafa; } .dark .input-style { background-color: #262626; border-color: #404040; color: #f5f5f5 }`}</style>
    </div>
  );
};