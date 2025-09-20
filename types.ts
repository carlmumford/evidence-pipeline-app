import type { Timestamp } from 'firebase/firestore';

export interface Document {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  simplifiedSummary?: string;
  year?: number;
  createdAt: Timestamp;
  // New fields for advanced search
  resourceType?: string;
  subjects?: string[];
  publicationTitle?: string;
  pdfUrl?: string;
}

export interface ExtractedInfo {
  title: string;
  authors: string;
  summary: string;
  year: number; // Will be 0 if not found
  // New fields for AI extraction
  resourceType: string;
  subjects: string; // AI will extract as a comma-separated string
  publicationTitle: string;
}
