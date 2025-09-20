export interface Document {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  simplifiedSummary?: string;
  year?: number;
}

export interface ExtractedInfo {
  title: string;
  authors: string;
  summary: string;
  year: number; // Will be 0 if not found
}
