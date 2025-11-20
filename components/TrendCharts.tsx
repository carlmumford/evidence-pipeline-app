import React, { useMemo } from 'react';
import type { Document } from '../types';

interface TrendChartsProps {
  documents: Document[];
}

interface YearData {
  year: number;
  count: number;
}

const LineChart: React.FC<{ data: YearData[]; color: string; title: string; description?: string }> = ({ data, color, title, description }) => {
    if (data.length < 2) {
        return <div className="text-center p-8 text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-lg">Not enough data to display trend for {title}.</div>;
    }
    
    const sortedData = useMemo(() => data.sort((a, b) => a.year - b.year), [data]);

    const minYear = sortedData[0].year;
    const maxYear = sortedData[sortedData.length - 1].year;
    const maxCount = Math.max(...sortedData.map(d => d.count), 1);

    const width = 500;
    const height = 250;
    const padding = 40;

    const points = sortedData.map(d => {
        const x = ((d.year - minYear) / (maxYear - minYear)) * (width - padding * 2) + padding;
        const y = height - ((d.count / maxCount) * (height - padding * 2)) - padding;
        return `${x},${y}`;
    }).join(' ');
    
    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">{title}</h4>
            {description && <p className="text-xs text-gray-500 mb-4">{description}</p>}
            <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title} className="w-full h-auto">
                {/* Axes */}
                <line x1={padding} y1={height - padding} x2={width-padding} y2={height - padding} stroke="currentColor" className="text-gray-300 dark:text-gray-600" />
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" className="text-gray-300 dark:text-gray-600"/>
                
                {/* Data Line */}
                <polyline fill="none" stroke={color} strokeWidth="3" points={points} strokeLinecap="round" strokeLinejoin="round" />
                
                {/* Data Points */}
                {sortedData.map((d, i) => (
                    <g key={i} className="group">
                        <circle 
                            cx={((d.year - minYear) / (maxYear - minYear)) * (width - padding * 2) + padding} 
                            cy={height - ((d.count / maxCount) * (height - padding * 2)) - padding} 
                            r="4" 
                            fill={color}
                            className="transition-all duration-200 group-hover:r-6"
                        />
                        {/* Tooltip */}
                        <rect 
                            x={((d.year - minYear) / (maxYear - minYear)) * (width - padding * 2) + padding - 25}
                            y={height - ((d.count / maxCount) * (height - padding * 2)) - padding - 35}
                            width="50"
                            height="25"
                            rx="4"
                            fill="#1f2937"
                            className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        />
                        <text 
                            x={((d.year - minYear) / (maxYear - minYear)) * (width - padding * 2) + padding}
                            y={height - ((d.count / maxCount) * (height - padding * 2)) - padding - 18}
                            textAnchor="middle"
                            fill="white"
                            fontSize="10"
                            fontWeight="bold"
                            className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        >
                            {d.count}
                        </text>
                    </g>
                ))}

                {/* Labels */}
                <text x={padding} y={height - padding + 20} fontSize="12" fill="currentColor" className="text-gray-500">{minYear}</text>
                <text x={width - padding} y={height - padding + 20} fontSize="12" textAnchor="end" fill="currentColor" className="text-gray-500">{maxYear}</text>
                <text x={padding - 10} y={padding} fontSize="12" textAnchor="end" fill="currentColor" className="text-gray-500">{maxCount}</text>
            </svg>
        </div>
    )
};

export const TrendCharts: React.FC<TrendChartsProps> = ({ documents }) => {
    const publicationsByYear = useMemo(() => {
        const counts: { [year: number]: number } = {};
        documents.forEach(doc => {
            if (doc.year && doc.year > 1980) { // Filter out outliers or very old data
                counts[doc.year] = (counts[doc.year] || 0) + 1;
            }
        });
        return Object.entries(counts).map(([year, count]) => ({ year: parseInt(year), count }));
    }, [documents]);

    const exclusionTrends = useMemo(() => {
        const counts: { [year: number]: number } = {};
        const keywords = ['exclusion', 'suspension', 'expulsion', 'zero tolerance'];
        documents.forEach(doc => {
             if (doc.year && doc.year > 1980) {
                const content = `${doc.title} ${doc.subjects.join(' ')} ${doc.riskFactors.join(' ')}`.toLowerCase();
                if (keywords.some(k => content.includes(k))) {
                    counts[doc.year] = (counts[doc.year] || 0) + 1;
                }
             }
        });
        return Object.entries(counts).map(([year, count]) => ({ year: parseInt(year), count }));
    }, [documents]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <LineChart 
                data={publicationsByYear} 
                color="#3b82f6" 
                title="Research Activity Over Time" 
                description="Number of publications in the database per year."
            />
            <LineChart 
                data={exclusionTrends} 
                color="#ef4444" 
                title="Focus on Exclusionary Discipline" 
                description="Trends in research mentioning suspension, expulsion, or zero tolerance."
            />
        </div>
    );
};