import React, { useState, useEffect } from 'react';

// A more descriptive set of steps to show progress
const analysisSteps = [
  "Connecting to secure analysis server...",
  "Uploading and parsing document...",
  "Identifying document structure...",
  "Extracting metadata (title, authors, year)...",
  "Analysing abstract for key themes...",
  "Scanning for statistics & risk factors...",
  "Generating simplified summary with AI...",
  "Finalising extracted data..."
];

export const AnalyzingIndicator: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    // This timer progresses the steps to give the user a sense of progress.
    const timer = setInterval(() => {
      setCurrentStepIndex(prevIndex => {
        // We stop at the last step to avoid looping, which would look strange
        // if the real process takes longer than the simulated one.
        if (prevIndex < analysisSteps.length - 1) {
          return prevIndex + 1;
        }
        return prevIndex;
      });
    }, 3500); // Each step takes 3.5 seconds

    // Cleanup the timer when the component is unmounted (i.e., when analysis finishes)
    return () => clearInterval(timer);
  }, []);

  const progressPercentage = ((currentStepIndex + 1) / analysisSteps.length) * 100;

  return (
    <div className="flex flex-col items-center justify-center p-8 w-full">
      <div className="w-full max-w-sm text-center">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Analysing Document</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Please keep this window open. This process may take up to a minute.
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
            <div 
                className="bg-accent h-2.5 rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${progressPercentage}%` }}
                role="progressbar"
                aria-valuenow={progressPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Analysis progress"
            ></div>
        </div>

        {/* Current Step Text */}
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 h-10 flex items-center justify-center">
          {analysisSteps[currentStepIndex]}
        </p>
      </div>
    </div>
  );
};