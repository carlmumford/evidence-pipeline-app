import React, { useMemo } from 'react';
import type { Document } from '../types';

interface TrendChartsProps {
  documents: Document[];
}

interface YearData {
  year: number;
  count: number;
}

// A simple line chart component using SVG
const LineChart: React.FC<{ data: YearData[]; color: string; title: string }> = ({ data, color, title }) => {
    if (data.length < 2) {
        return <div className="text-center p-4 text-gray-500">Not enough data to display trend.</div>;
    }
    
    const sortedData = useMemo(() => data.sort((a, b) => a.year - b.year), [data]);

    const minYear = sortedData[0].year;
    const maxYear = sortedData[sortedData.length - 1].year;
    const maxCount = Math.max(...sortedData.map(d => d.count), 0);

    const width = 500;
    const height = 200;
    const padding = 30;

    const points = sortedData.map(d => {
        const x = ((d.year - minYear) / (maxYear - minYear)) * (width - padding * 2) + padding;
        const y = height - ((d.count / maxCount) * (height - padding * 2)) - padding;
        return `${x},${y}`;
    }).join(' ');
    
    return (
        <div>
            <h4 className="text-lg font-semibold text-center text-gray-700 dark:text-gray-300 mb-2">{title}</h4>
            <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
                <line x1={padding} y1={height - padding} x2={width-padding} y2={height - padding} stroke="currentColor" className="text-gray-300 dark:text-gray-700" />
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="currentColor" className="text-gray-300 dark:text-gray-700"/>
                
                <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
                
                {sortedData.map((d, i) => (
                    <circle key={i} cx={((d.year - minYear) / (maxYear - minYear)) * (width - padding * 2) + padding} cy={height - ((d.count / maxCount) * (height - padding * 2)) - padding} r="3" fill={color}>
                         <title>{`${d.year}: ${d.count} publication(s)`}</title>
                    </circle>
                ))}

                <text x={padding} y={height - padding + 15} fontSize="10" fill="currentColor" className="text-gray-500">{minYear}</text>
                <text x={width - padding} y={height - padding + 15} fontSize="10" textAnchor="end" fill="currentColor" className="text-gray-500">{maxYear}</text>
                <text x={padding - 5} y={padding} fontSize="10" textAnchor="end" fill="currentColor" className="text-gray-500">{maxCount}</text>
            </svg>
        </div>
    )
};

export const TrendCharts: React.FC<TrendChartsProps> = ({ documents }) => {
    const publicationsByYear = useMemo(() => {
        const counts: { [year: number]: number } = {};
        documents.forEach(doc => {
            if (doc.year) {
                counts[doc.year] = (counts[doc.year] || 0) + 1;
            }
        });
        return Object.entries(counts).map(([year, count]) => ({ year: parseInt(year), count }));
    }, [documents]);

    const topicTrends = useMemo(() => {
        const topics = {
            "Racial Disparity": ['racial disparity', 'students of color'],
            "Disability": ['disability', 'students with disabilities']
        };
        const trendData: { [topic: string]: YearData[] } = {};

        Object.entries(topics).forEach(([topicName, keywords]) => {
            const counts: { [year: number]: number } = {};
            documents.forEach(doc => {
                if (doc.year) {
                    const docContent = `${doc.subjects?.join(' ')} ${doc.keyPopulations?.join(' ')}`.toLowerCase();
                    if (keywords.some(kw => docContent.includes(kw))) {
                        counts[doc.year] = (counts[doc.year] || 0) + 1;
                    }
                }
            });
            trendData[topicName] = Object.entries(counts).map(([year, count]) => ({ year: parseInt(year), count }));
        });

        return trendData;
    }, [documents]);

    const hasPubData = publicationsByYear.length > 1;
    const hasTopicData = Object.values(topicTrends).some(d => d.length > 1);

    if (!hasPubData && !hasTopicData) return null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {hasPubData && <LineChart data={publicationsByYear} color="#42A5F5" title="Publications by Year" />}
                {topicTrends["Racial Disparity"].length > 1 && <LineChart data={topicTrends["Racial Disparity"]} color="#EF5350" title="Focus on Racial Disparity" />}
                {topicTrends["Disability"].length > 1 && <LineChart data={topicTrends["Disability"]} color="#66BB6A" title="Focus on Disability" />}
             </div>
        </div>
    );
};
