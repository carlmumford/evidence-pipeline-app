import React, { useState, useMemo } from 'react';
import type { Document } from '../types';
import { LoadingSpinner } from '../constants';

interface EvidenceMapProps {
  documents: Document[];
  onNodeClick: (query: string) => void;
}

// A simple location-to-coordinate mapping. In a real app, this would use a geocoding API.
const locationCoords: Record<string, { lat: number; lon: number }> = {
  'Cambridge, MA, USA': { lat: 42.37, lon: -71.10 },
  'Bloomington, IN, USA': { lat: 39.16, lon: -86.52 },
  'San Francisco, CA, USA': { lat: 37.77, lon: -122.41 },
  'Washington, D.C., USA': { lat: 38.90, lon: -77.03 },
  // Add more locations here as needed
};

// Simplified Equirectangular projection
const project = (lat: number, lon: number, width: number, height: number) => {
    const x = (lon + 180) * (width / 360);
    const y = (lat * -1 + 90) * (height / 180);
    return { x, y };
};

// Location Icon
const LocationMarkerIcon: React.FC<{className?: string}> = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
);


export const EvidenceMap: React.FC<EvidenceMapProps> = ({ documents, onNodeClick }) => {
    const [userLocationInput, setUserLocationInput] = useState('');
    const [isLocating, setIsLocating] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [activeMarker, setActiveMarker] = useState<{ x: number, y: number, docs: Document[] } | null>(null);

    const handleLocateUser = () => {
        setIsLocating(true);
        setLocationError(null);
        navigator.geolocation.getCurrentPosition(
            (_position) => {
                // In a real app, we'd use these coords. Here we just confirm it works.
                setUserLocationInput('Your Current Location');
                setIsLocating(false);
                // We would then find nearby documents. For this demo, we can't do that.
                // We'll just set the input text.
            },
            (error) => {
                setLocationError('Could not get your location. Please check your browser settings.');
                console.error(error);
                setIsLocating(false);
            }
        );
    };
    
    const documentsByLocation = useMemo(() => {
        const grouped: Record<string, Document[]> = {};
        documents.forEach(doc => {
            if (doc.location) {
                if (!grouped[doc.location]) {
                    grouped[doc.location] = [];
                }
                grouped[doc.location].push(doc);
            }
        });
        return grouped;
    }, [documents]);
    
    const mapWidth = 800;
    const mapHeight = 400;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 md:p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <input
                    type="text"
                    value={userLocationInput}
                    onChange={(e) => setUserLocationInput(e.target.value)}
                    placeholder="Enter your city or country..."
                    className="flex-grow w-full px-4 py-2 bg-gray-100 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 rounded-md border border-transparent focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <button
                    onClick={handleLocateUser}
                    disabled={isLocating}
                    className="flex items-center justify-center px-4 py-2 bg-accent text-white font-semibold rounded-lg shadow-sm hover:bg-accent-hover disabled:bg-gray-400 disabled:cursor-wait"
                >
                    {isLocating ? <LoadingSpinner /> : <LocationMarkerIcon />}
                    <span className="ml-2">{isLocating ? 'Locating...' : 'Use my location'}</span>
                </button>
            </div>
            {locationError && <p className="text-sm text-red-500 mb-4">{locationError}</p>}
            
            <div className="relative w-full overflow-hidden" style={{ paddingTop: `${(mapHeight / mapWidth) * 100}%` }}>
                 <svg 
                    viewBox={`0 0 ${mapWidth} ${mapHeight}`} 
                    className="absolute top-0 left-0 w-full h-full"
                    aria-label="World map showing locations of research"
                 >
                    <path d="M400 0 L400 400 M0 200 L800 200" stroke="#e5e5e5" strokeWidth="0.5" className="dark:stroke-gray-700" />
                    <rect width={mapWidth} height={mapHeight} className="fill-gray-100 dark:fill-gray-900/50" />
                    {/* A very simplified world map path */}
                    <path
                        d="M 125,125 C 100,25 0,75 25,175 S 150,250 125,225 S 25,200 75,125 M 350,50 L 300,75 L 250,50 L 200,100 C 150,150 175,250 250,250 C 350,250 400,100 350,50 M 500,75 L 450,100 L 425,150 L 450,200 L 500,225 L 550,200 L 525,100 Z M 650,50 C 600,75 625,150 675,150 C 725,150 750,75 700,50 L 675,75 Z M 450,275 L 550,275 L 525,325 L 475,325 Z M 150,275 L 250,300 L 300,275 L 200,250 Z"
                        className="fill-gray-200 dark:fill-gray-700 stroke-gray-300 dark:stroke-gray-600"
                        strokeWidth="0.5"
                    />

                    {Object.entries(documentsByLocation).map(([location, docs]) => {
                        const coords = locationCoords[location];
                        // FIX: Added a check to ensure `docs` is a valid array with items before proceeding.
                        // This prevents potential runtime errors if `docs` is empty or not an array, which may be what the TypeScript error is flagging.
                        if (!coords || !Array.isArray(docs) || docs.length === 0) return null;
                        
                        const { x, y } = project(coords.lat, coords.lon, mapWidth, mapHeight);

                        return (
                            <g key={location} transform={`translate(${x}, ${y})`}>
                                <circle
                                    cx="0"
                                    cy="0"
                                    r={4 + docs.length}
                                    className="fill-accent opacity-70 cursor-pointer transition-all hover:opacity-100 hover:stroke-2 hover:stroke-white/50"
                                    onClick={() => setActiveMarker(activeMarker && activeMarker.docs?.[0]?.id === docs[0].id ? null : { x, y, docs })}
                                    aria-label={`Research location: ${location}. ${docs.length} document(s).`}
                                />
                            </g>
                        );
                    })}

                    {activeMarker && (
                        <foreignObject 
                            x={activeMarker.x > mapWidth / 2 ? activeMarker.x - 260 : activeMarker.x + 15}
                            y={activeMarker.y - 20}
                            width="250"
                            height="150"
                        >
                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 border border-gray-200 dark:border-gray-700 text-sm overflow-y-auto max-h-[150px]">
                                {/* FIX: Safely access location from the first document in the array. */}
                                <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">{activeMarker.docs?.[0]?.location}</h4>
                                <ul className="space-y-1">
                                    {activeMarker.docs.map(doc => (
                                        <li key={doc.id}>
                                            <button 
                                                onClick={() => onNodeClick(`"${doc.title}"`)} 
                                                className="text-left text-accent hover:underline text-xs"
                                            >
                                                {doc.title}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </foreignObject>
                    )}
                </svg>
            </div>
        </div>
    );
};