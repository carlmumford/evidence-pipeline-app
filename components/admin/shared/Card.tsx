import React from 'react';

interface CardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, icon, children, className = '' }) => {
  return (
    <section 
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 ${className}`}
        aria-labelledby={`card-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <header className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 id={`card-title-${title.replace(/\s+/g, '-').toLowerCase()}`} className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-3">
          {icon}
          <span>{title}</span>
        </h3>
      </header>
      <div className="p-4">
        {children}
      </div>
    </section>
  );
};