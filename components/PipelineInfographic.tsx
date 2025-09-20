import React from 'react';
import {
  AcademicCapIcon,
  ExclamationTriangleIcon,
  ScaleIcon,
  BuildingLibraryIcon,
  ArrowRightIcon,
} from '../constants';

interface PipelineStageProps {
  icon: React.ReactNode;
  title: string;
  searchTerm: string;
  onStageClick: (term: string) => void;
  color: string;
}

const PipelineStage: React.FC<PipelineStageProps> = ({ icon, title, searchTerm, onStageClick, color }) => (
    <button 
        onClick={() => onStageClick(searchTerm)}
        className="flex flex-col items-center text-center group w-48"
        aria-label={`Search for evidence related to ${title}`}
    >
        <div className={`flex items-center justify-center w-20 h-20 rounded-full bg-base-200 dark:bg-dark-base-200 border-4 ${color} transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}>
            {icon}
        </div>
        <h4 className="mt-3 font-semibold text-slate-700 dark:text-slate-200 group-hover:text-brand-primary dark:group-hover:text-brand-accent">{title}</h4>
    </button>
);

const Connector: React.FC = () => (
    <div className="flex-1 flex items-center justify-center -mx-4">
        <ArrowRightIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
    </div>
);


export const PipelineInfographic: React.FC<{ onStageClick: (term: string) => void }> = ({ onStageClick }) => {
  const stages = [
    {
      icon: <AcademicCapIcon className="h-10 w-10 text-blue-500"/>,
      title: 'School Environment',
      searchTerm: 'school policies',
      color: 'border-blue-500'
    },
    {
      icon: <ExclamationTriangleIcon className="h-10 w-10 text-yellow-500"/>,
      title: 'Discipline & Risk Factors',
      searchTerm: 'suspension expulsion "zero tolerance"',
      color: 'border-yellow-500'
    },
    {
      icon: <ScaleIcon className="h-10 w-10 text-red-500"/>,
      title: 'Juvenile Justice System',
      searchTerm: '"juvenile justice" arrest',
      color: 'border-red-500'
    },
    {
      icon: <BuildingLibraryIcon className="h-10 w-10 text-slate-500"/>,
      title: 'Incarceration',
      searchTerm: 'incarceration prison',
      color: 'border-slate-500'
    }
  ];

  return (
    <div className="bg-base-100 dark:bg-dark-base-300 rounded-xl shadow-md p-8 border border-base-300 dark:border-slate-700">
        <div className="flex flex-col md:flex-row items-center justify-around gap-y-8">
            {stages.map((stage, index) => (
                <React.Fragment key={stage.title}>
                    <PipelineStage {...stage} onStageClick={onStageClick} />
                    {index < stages.length - 1 && <Connector />}
                </React.Fragment>
            ))}
        </div>
    </div>
  );
};