
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-base-100 dark:bg-dark-base-300 shadow-md sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-8 py-4">
        <h1 className="text-xl sm:text-2xl font-bold text-brand-primary dark:text-white">
          The School to Prison Pipeline Evidence Project
        </h1>
      </div>
    </header>
  );
};
