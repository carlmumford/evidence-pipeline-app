import type { Timestamp } from 'firebase/firestore';

export interface Document {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  simplifiedSummary?: string;
  year?: number;
  createdAt: Timestamp;
  // Existing fields
  resourceType?: string;
  subjects?: string[];
  publicationTitle?: string;
  pdfUrl?: string;
  // New fields for professional features
  interventions?: string[];
  keyPopulations?: string[];
  riskFactors?: string[];
  keyStats?: string[];
  keyOrganizations?: string[];
}

export interface ExtractedInfo {
  title: string;
  authors: string;
  summary: string;
  year: number;
  // Existing fields
  resourceType: string;
  subjects: string; // AI will extract as a comma-separated string
  publicationTitle: string;
  // New fields for AI extraction
  interventions: string; // AI will extract as a comma-separated string
  keyPopulations: string; // AI will extract as a comma-separated string
  riskFactors: string; // AI will extract as a comma-separated string
  keyStats: string; // AI will extract as a comma-separated string
  keyOrganizations: string; // AI will extract as a comma-separated string
}

// Added for multi-user management
export interface User {
    username: string;
    password?: string; // Optional because we don't always expose it
    role: 'admin' | 'editor';
}

// Added for the AI Research Discovery feature
export interface DiscoveredResearch {
  title: string;
  url: string;
  authors: string; // AI will provide this as a comma-separated string
  summary: string;
  confidenceScore: number; // A score from 1-100
  sources?: { uri: string; title: string }[]; // From grounding chunks
}