import React from 'react';

interface Filters {
  startYear: string;
  endYear: string;
  resourceTypes: string[];
  subjects: string[];
  interventions: string[];
  keyPopulations: string[];
  riskFactors: string[];
}

interface RefineResultsPanelProps {
  options: {
    resourceTypes: string[];
    subjects: string[];
    interventions: string[];
    keyPopulations: string[];
    riskFactors: string[];
  };
  filters: Filters;
  onFilterChange: (newFilters: Filters) => void;
  disabled: boolean;
}

const FilterSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h4 className="font-semibold mb-2 text-slate-700 dark:text-slate-300">{title}</h4>
    {children}
  </div>
);

const CheckboxFilterGroup: React.FC<{
  items: string[];
  checkedItems: string[];
  onCheckboxChange: (value: string) => void;
}> = ({ items, checkedItems, onCheckboxChange }) => {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1 max-h-40 overflow-y-auto pr-2">
      {items.map(item => (
        <label key={item} className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={checkedItems.includes(item)}
            onChange={() => onCheckboxChange(item)}
            className="h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-accent"
          />
          <span className="text-sm capitalize">{item}</span>
        </label>
      ))}
    </div>
  );
};


export const RefineResultsPanel: React.FC<RefineResultsPanelProps> = ({ options, filters, onFilterChange, disabled }) => {
  
  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    const value = e.target.value;
    onFilterChange({
      ...filters,
      [type === 'start' ? 'startYear' : 'endYear']: value
    });
  };

  const handleCheckboxChange = (category: keyof Omit<Filters, 'startYear' | 'endYear'>, value: string) => {
    const currentValues = filters[category] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(item => item !== value)
      : [...currentValues, value];
    
    onFilterChange({ ...filters, [category]: newValues });
  };

  return (
    <div className={`bg-base-100 dark:bg-dark-base-300 p-4 rounded-lg shadow-md border border-base-300 dark:border-slate-700 transition-opacity ${disabled ? 'opacity-50' : ''}`}>
      <h3 className="text-lg font-bold mb-4 text-brand-primary dark:text-brand-accent">Refine Results</h3>
      <div className={`space-y-6 ${disabled ? 'pointer-events-none' : ''}`}>
        <FilterSection title="Publication Year">
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="From"
              value={filters.startYear}
              onChange={e => handleYearChange(e, 'start')}
              className="w-full input-style"
            />
            <span>-</span>
            <input
              type="number"
              placeholder="To"
              value={filters.endYear}
              onChange={e => handleYearChange(e, 'end')}
              className="w-full input-style"
            />
          </div>
        </FilterSection>

        {options.riskFactors.length > 0 && <FilterSection title="Risk Factor">
          <CheckboxFilterGroup items={options.riskFactors} checkedItems={filters.riskFactors} onCheckboxChange={(val) => handleCheckboxChange('riskFactors', val)} />
        </FilterSection>}

        {options.interventions.length > 0 && <FilterSection title="Intervention">
            <CheckboxFilterGroup items={options.interventions} checkedItems={filters.interventions} onCheckboxChange={(val) => handleCheckboxChange('interventions', val)} />
        </FilterSection>}

        {options.keyPopulations.length > 0 && <FilterSection title="Key Population">
            <CheckboxFilterGroup items={options.keyPopulations} checkedItems={filters.keyPopulations} onCheckboxChange={(val) => handleCheckboxChange('keyPopulations', val)} />
        </FilterSection>}
        
        {options.resourceTypes.length > 0 && <FilterSection title="Resource Type">
            <CheckboxFilterGroup items={options.resourceTypes} checkedItems={filters.resourceTypes} onCheckboxChange={(val) => handleCheckboxChange('resourceTypes', val)} />
        </FilterSection>}

        {options.subjects.length > 0 && <FilterSection title="Subject">
            <CheckboxFilterGroup items={options.subjects} checkedItems={filters.subjects} onCheckboxChange={(val) => handleCheckboxChange('subjects', val)} />
        </FilterSection>}

      </div>
       <style>{`.input-style { background-color: #F5F5F5; border: 1px solid #E0E0E0; border-radius: 0.375rem; padding: 0.5rem 0.75rem; } .dark .input-style { background-color: #1E1E1E; border-color: #2C2C2C; }`}</style>
    </div>
  );
};
