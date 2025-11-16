import type { Timestamp } from 'firebase/firestore';

export interface Document {
  id: string;
  title: string;
  authors: string[];
  summary: string; // The original abstract
  simplifiedSummary: string; // The AI-generated simple summary
  year?: number;
  createdAt: Timestamp;
  resourceType: string;
  subjects: string[];
  publicationTitle: string;
  pdfUrl: string;
  interventions: string[];
  keyPopulations: string[];
  riskFactors: string[];
  mentalHealthConditions: string[];
  keyStats: string[];
  keyOrganisations: string[];
  location?: string;
  
  // New structured fields
  strengthOfEvidence?: string;
  sampleSize?: string;
  aim?: string;
  population?: string;
  methods?: string;
  keyFindings?: string; // Semicolon-separated string from AI
  implications?: string;
}

export interface ExtractedInfo {
  title: string;
  authors: string;
  summary: string; // The original abstract
  year: number;
  resourceType: string;
  subjects: string; // AI will extract as a comma-separated string
  publicationTitle: string;
  interventions: string; // AI will extract as a comma-separated string
  keyPopulations: string; // AI will extract as a comma-separated string
  riskFactors: string; // AI will extract as a comma-separated string
  mentalHealthConditions: string; // AI will extract as a comma-separated string
  keyStats: string; // AI will extract as a comma-separated string
  keyOrganisations: string; // AI will extract as a comma-separated string
  location: string;

  // New structured fields
  strengthOfEvidence: string;
  sampleSize: string;
  aim: string;
  population: string;
  methods: string;
  keyFindings: string; // Semicolon-separated string
  implications: string;
}

export interface User {
    username: string;
    password?: string; // Optional because we don't always expose it
    role: 'admin' | 'editor' | 'trial';
}

export interface DiscoveredResearch {
  title: string;
  url: string;
  authors: string; // AI will provide this as a comma-separated string
  summary: string;
  confidenceScore: number; // A score from 1-100
  sources?: { uri: string; title: string }[]; // From grounding chunks
}

export interface Filters {
  startYear: string;
  endYear: string;
  resourceTypes: string[];
  subjects: string[];
  interventions: string[];
  keyPopulations: string[];
  riskFactors: string[];
  keyOrganisations: string[];
  mentalHealthConditions: string[];
}