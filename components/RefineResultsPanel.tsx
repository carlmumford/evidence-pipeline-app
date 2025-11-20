import React, { useState, useMemo } from 'react';
import type { Document, Filters } from '../types';
import { UploadIcon, ListIcon, ChartBarIcon, ChevronDownIcon, CloseIcon, ExclamationTriangleIcon, SearchIcon } from '../constants';
import { authService } from '../services/authService';

interface RefineResultsPanelProps {
  documents: Document[]; // documents passed here should be search-filtered if possible for accurate counts
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
  termMappings: Record<string, Record<string, string>> | null;
}

const FilterSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean; activeCount?: number }> = ({ title, children, defaultOpen = false, activeCount = 0 }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
  
    return (
      <div className="py-2 border-b border-gray-100 dark:border-gray-800/50 last:border-0">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex justify-between items-center px-5 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors rounded-lg group"
            aria-expanded={isOpen}
            aria-controls={`filter-section-${title.replace(/\s+/g, '-')}`}
          >
              <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-gray-800 dark:text-gray-400 dark:group-hover:text-gray-200 transition-colors">{title}</h4>
                  {activeCount > 0 && (
                      <span className="bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{activeCount}</span>
                  )}
              </div>
              <ChevronDownIcon className={`h-4 w-4 text-gray-400 group-hover:text-accent transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        
        {isOpen && (
          <div 
            id={`filter-section-${title.replace(/\s+/g, '-')}`}
            className="px-5 pb-4 pt-1 animate-fade-in"
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
  const [search, setSearch] = useState('');
  
  const filteredItems = items.filter(item => item.toLowerCase().includes(search.toLowerCase()));

  if (items.length === 0) return <p className="text-xs text-gray-400 italic p-1">No options available</p>;

  return (
    <div className="space-y-2">
       {items.length > 5 && (
           <div className="relative">
               <SearchIcon className="absolute left-2 top-2.5 h-3.5 w-3.5 text-gray-400"/>
               <input 
                    type="text" 
                    placeholder="Search..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800 focus:ring-1 focus:ring-accent focus:border-accent"
               />
           </div>
       )}
        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
        {filteredItems.map(item => (
            <label key={item} className="flex items-center space-x-3 cursor-pointer group p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-all duration-200">
            <div className="relative flex items-center h-5">
                <input
                    type="checkbox"
                    checked={checkedItems.includes(item)}
                    onChange={() => onCheckboxChange(item)}
                    className="peer h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-accent focus:ring-accent focus:ring-offset-0 bg-white dark:bg-gray-800 transition-all"
                />
            </div>
            <div className="flex-1 min-w-0">
                <span className={`text-sm capitalize block truncate transition-colors ${checkedItems.includes(item) ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-300'}`}>
                    {item}
                </span>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-600 tabular-nums bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full group-hover:bg-white dark:group-hover:bg-gray-700 transition-colors">
                {counts[item] || 0}
            </span>
            </label>
        ))}
        {filteredItems.length === 0 && <p className="text-xs text-gray-400 italic">No matches found.</p>}
        </div>
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
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group relative overflow-hidden ${
            isActive 
            ? 'bg-white dark:bg-gray-800 text-accent shadow-soft ring-1 ring-gray-100 dark:ring-gray-700' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 hover:shadow-sm'
        }`}
    >
        <div className={`z-10 ${isActive ? 'text-accent' : 'text-gray-400 group-hover:text-accent transition-colors'}`}>
            {icon}
        </div>
        <span className="flex-grow text-left z-10">{label}</span>
        {badge !== undefined && (
            <span className={`z-10 px-2 py-0.5 text-xs font-bold rounded-full ${isActive ? 'bg-accent/10 text-accent' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                {badge}
            </span>
        )}
    </button>
);


export const RefineResultsPanel: React.FC<RefineResultsPanelProps> = ({ documents, options, filters, onFilterChange, onSetView, onOpenUpload, savedDocCount, currentView, onClose, termMappings }) => {
  const currentUser = useMemo(() => authService.getCurrentUser(), []);

  const filterCounts = useMemo(() => {
    if (!documents || documents.length === 0) return {};
    
    const allCounts: { [category: string]: Record<string, number> } = {};

    const categories = [
        'resourceTypes', 'subjects', 'interventions', 'keyPopulations',
        'riskFactors', 'keyOrganisations', 'mentalHealthConditions'
    ] as const;

    const docKeys: Record<typeof categories[number], keyof Document> = {
        resourceTypes: 'resourceType',
        subjects: 'subjects',
        interventions: 'interventions',
        keyPopulations: 'keyPopulations',
        riskFactors: 'riskFactors',
        keyOrganisations: 'keyOrganisations',
        mentalHealthConditions: 'mentalHealthConditions',
    };

    categories.forEach(category => {
        const docKey = docKeys[category];
        const categoryCounts: Record<string, number> = {};
        
        documents.forEach(doc => {
            const values = doc[docKey];
            const docValues = Array.isArray(values) ? values : (typeof values === 'string' && values ? [values] : []);
            
            // If mappings are available, count based on the canonical term.
            if (termMappings) {
                const mappingsForCategory = termMappings[category];
                if (mappingsForCategory) {
                    const canonicalTermsInDoc = new Set<string>();
                    docValues.forEach(term => {
                        const canonicalTerm = mappingsForCategory[term.toLowerCase().trim()];
                        if (canonicalTerm) {
                            canonicalTermsInDoc.add(canonicalTerm);
                        }
                    });
                    canonicalTermsInDoc.forEach(canonicalTerm => {
                        categoryCounts[canonicalTerm] = (categoryCounts[canonicalTerm] || 0) + 1;
                    });
                }
            } 
            // Before mappings arrive, count each raw term individually.
            else {
                docValues.forEach(term => {
                    categoryCounts[term] = (categoryCounts[term] || 0) + 1;
                });
            }
        });
        allCounts[category] = categoryCounts;
    });

    return allCounts;
  }, [documents, termMappings]);
  
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
    <div className="h-full flex flex-col bg-gray-50/80 dark:bg-gray-900/50 backdrop-blur-md border-r border-gray-200 dark:border-gray-800">
        <div className="p-5 space-y-3 border-b border-gray-200 dark:border-gray-800">
            <div className="flex justify-end lg:hidden mb-2">
                <button 
                    onClick={onClose} 
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Close filters"
                >
                    <CloseIcon />
                </button>
            </div>
            <div className="space-y-1.5">
                <NavButton icon={<UploadIcon />} label="Upload Evidence" onClick={onOpenUpload} isActive={false} />
                <NavButton icon={<ListIcon />} label="My Saved List" onClick={() => onSetView('list')} isActive={currentView === 'list'} badge={savedDocCount}/>
                {currentUser?.role !== 'trial' && (
                    <NavButton icon={<ChartBarIcon />} label="Data & Insights" onClick={() => onSetView('data')} isActive={currentView === 'data'}/>
                )}
            </div>
        </div>
        
        {currentUser?.role === 'trial' && (
             <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800 bg-amber-50/50 dark:bg-amber-900/10">
                <a
                    href="mailto:carl@schooltoprisonpipeline.org"
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-all text-amber-700 bg-amber-100 hover:bg-amber-200 dark:text-amber-400 dark:bg-amber-900/30 dark:hover:bg-amber-900/50"
                >
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    Report an Issue
                </a>
            </div>
        )}

        <div className="flex-grow overflow-y-auto scrollbar-hide">
            <div className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur flex justify-between items-center px-5 py-4 border-b border-gray-200 dark:border-gray-800 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 tracking-tight">Filter Results</h3>
                {hasActiveFilters && (
                    <button onClick={clearFilters} className="text-xs font-semibold text-accent hover:text-accent-dark transition-colors px-2 py-1 rounded hover:bg-accent/5">
                        Reset All
                    </button>
                )}
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800/50">
                <FilterSection title="Publication Year" defaultOpen={true} activeCount={(filters.startYear || filters.endYear) ? 1 : 0}>
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1 group">
                            <input 
                                type="number" 
                                placeholder="YYYY" 
                                value={filters.startYear} 
                                onChange={e => handleYearChange(e, 'start')} 
                                className="block w-full pl-3 pr-3 pt-5 pb-2 rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-accent focus:border-accent transition-all shadow-sm group-hover:border-gray-300" 
                            />
                            <span className="absolute left-3 top-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide pointer-events-none">From</span>
                        </div>
                        <span className="text-gray-300 dark:text-gray-600 font-light">—</span>
                        <div className="relative flex-1 group">
                            <input 
                                type="number" 
                                placeholder="YYYY" 
                                value={filters.endYear} 
                                onChange={e => handleYearChange(e, 'end')} 
                                className="block w-full pl-3 pr-3 pt-5 pb-2 rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-accent focus:border-accent transition-all shadow-sm group-hover:border-gray-300" 
                            />
                             <span className="absolute left-3 top-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide pointer-events-none">To</span>
                        </div>
                    </div>
                </FilterSection>

                {options.riskFactors.length > 0 && <FilterSection title="Risk Factors" defaultOpen={true} activeCount={filters.riskFactors.length}>
                <CheckboxFilterGroup items={options.riskFactors} checkedItems={filters.riskFactors} onCheckboxChange={(val) => handleCheckboxChange('riskFactors', val)} counts={filterCounts.riskFactors || {}} />
                </FilterSection>}

                {options.mentalHealthConditions.length > 0 && <FilterSection title="Mental Health" activeCount={filters.mentalHealthConditions.length}>
                    <CheckboxFilterGroup items={options.mentalHealthConditions} checkedItems={filters.mentalHealthConditions} onCheckboxChange={(val) => handleCheckboxChange('mentalHealthConditions', val)} counts={filterCounts.mentalHealthConditions || {}}/>
                </FilterSection>}

                {options.interventions.length > 0 && <FilterSection title="Interventions" activeCount={filters.interventions.length}>
                    <CheckboxFilterGroup items={options.interventions} checkedItems={filters.interventions} onCheckboxChange={(val) => handleCheckboxChange('interventions', val)} counts={filterCounts.interventions || {}}/>
                </FilterSection>}

                {options.keyPopulations.length > 0 && <FilterSection title="Key Populations" activeCount={filters.keyPopulations.length}>
                    <CheckboxFilterGroup items={options.keyPopulations} checkedItems={filters.keyPopulations} onCheckboxChange={(val) => handleCheckboxChange('keyPopulations', val)} counts={filterCounts.keyPopulations || {}}/>
                </FilterSection>}

                 {options.subjects.length > 0 && <FilterSection title="Subjects" activeCount={filters.subjects.length}>
                    <CheckboxFilterGroup items={options.subjects} checkedItems={filters.subjects} onCheckboxChange={(val) => handleCheckboxChange('subjects', val)} counts={filterCounts.subjects || {}}/>
                </FilterSection>}
                
                {options.resourceTypes.length > 0 && <FilterSection title="Resource Type" activeCount={filters.resourceTypes.length}>
                    <CheckboxFilterGroup items={options.resourceTypes} checkedItems={filters.resourceTypes} onCheckboxChange={(val) => handleCheckboxChange('resourceTypes', val)} counts={filterCounts.resourceTypes || {}}/>
                </FilterSection>}
                
                {options.keyOrganisations.length > 0 && <FilterSection title="Key Organisations" activeCount={filters.keyOrganisations.length}>
                    <CheckboxFilterGroup items={options.keyOrganisations} checkedItems={filters.keyOrganisations} onCheckboxChange={(val) => handleCheckboxChange('keyOrganisations', val)} counts={filterCounts.keyOrganisations || {}}/>
                </FilterSection>}
            </div>
            
            <div className="p-8 text-center text-xs text-gray-400 dark:text-gray-600">
                Evidence Project v1.1
            </div>
        </div>
    </div>
  );
};