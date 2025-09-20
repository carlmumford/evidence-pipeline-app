import React from 'react';
import type { Document } from './types';

export const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'doc-1',
    title: 'The School-to-Prison Pipeline: Structuring Legal Reform',
    authors: ['Catherine Y. Kim', 'Daniel J. Losen', 'Damon T. Hewitt'],
    year: 2010,
    summary: 'An examination of the policies and practices that push students, particularly those from disadvantaged backgrounds, out of schools and into the justice system.',
    simplifiedSummary: 'This document looks at how school rules and policies can unintentionally lead students, especially those from underprivileged backgrounds, into the criminal justice system. It discusses ways to change these legal structures to prevent this.'
  },
  {
    id: 'doc-2',
    title: 'Zero Tolerance, High Stakes, and the School-to-Prison Pipeline',
    authors: ['Russell J. Skiba'],
    year: 2012,
    summary: 'This paper explores the impact of zero tolerance policies in schools and their contribution to increased suspension, expulsion, and referral to law enforcement.',
    simplifiedSummary: "This paper examines 'zero tolerance' rules in schools. It argues that these strict policies lead to more students being suspended, expelled, or reported to the police, effectively pushing them towards the justice system."
  },
  {
    id: 'doc-3',
    title: 'Race, Disability, and the School-to-Prison Pipeline',
    authors: ['Thalia N.C. Gonzalez'],
    year: 2017,
    summary: 'Analyzes the disproportionate impact of disciplinary policies on students of color and students with disabilities, highlighting the intersectionality of race and disability.',
    simplifiedSummary: 'This research focuses on how school discipline rules unfairly affect students of color and those with disabilities. It shows that these students are more likely to be punished, which is a key part of the school-to-prison pipeline.'
  },
  {
    id: 'doc-4',
    title: 'Dismantling the School-to-Prison Pipeline: A Restorative Justice Approach',
    authors: ['The Advancement Project'],
    year: 2014,
    summary: 'Advocates for the use of restorative justice practices as an alternative to punitive disciplinary measures to build community and reduce conflict in schools.',
    simplifiedSummary: "This report proposes using 'restorative justice' in schools instead of harsh punishments. This approach focuses on repairing harm and building community to solve conflicts, aiming to break the cycle of the school-to-prison pipeline."
  }
];

export const SearchIcon: React.FC<{className?: string}> = ({ className = "h-6 w-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

export const UploadIcon: React.FC<{className?: string}> = ({ className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
  </svg>
);

export const DocumentIcon: React.FC<{className?: string}> = ({ className = "h-8 w-8" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);

export const CloseIcon: React.FC<{className?: string}> = ({ className = "h-6 w-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

export const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);