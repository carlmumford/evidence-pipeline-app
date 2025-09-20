import React, { useState, useEffect } from 'react';

interface AnalyzingIndicatorProps {
  duration: number; // in seconds
}

export const AnalyzingIndicator: React.FC<AnalyzingIndicatorProps> = ({ duration }) => {
  const [countdown, setCountdown] = useState(duration);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    // Only run the timer if countdown is greater than 0
    if (countdown > 0) {
      const timerId = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      // Cleanup function to clear the timeout
      return () => clearTimeout(timerId);
    }
  }, [countdown]);

  // Calculate progress based on the countdown.
  // The stroke-dasharray/offset technique animates the circle's border.
  const progress = ((duration - countdown) / duration) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-8 transition-opacity duration-300 animate-fade-in">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            className="text-base-200 dark:text-dark-base-200"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="60"
            cy="60"
          />
          {/* Progress circle */}
          <circle
            className="text-brand-primary dark:text-brand-accent"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="60"
            cy="60"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
            transform="rotate(-90 60 60)"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-slate-700 dark:text-slate-300">
          {countdown > 0 ? `${countdown}s` : '...'}
        </span>
      </div>
      <p className="mt-4 text-lg font-semibold text-slate-600 dark:text-slate-400">
        Analyzing Document...
      </p>
      <p className="mt-1 text-sm text-slate-500">AI is extracting key information.</p>
    </div>
  );
};
