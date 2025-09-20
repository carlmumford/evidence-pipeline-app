
import { GoogleGenAI, Type } from "@google/genai";
import type { Document, ExtractedInfo } from '../types';

// The API key is read from environment variables.
// Per Gemini API guidelines, it must be accessed via process.env.API_KEY.
// Vite is configured to replace this with the actual key at build time.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSearchSuggestions = async (query: string, existingDocuments: Document[]): Promise<string[]> => {
    const documentTitles = existingDocuments.map(doc => doc.title).join(', ');

    const prompt = `
        You are an AI research assistant for the 'School to Prison Pipeline Evidence Project'.
        A user is searching for "${query}".
        Based on this query and the context of existing document titles in our database, suggest 3 to 5 related, more specific, or alternative search terms that could help them find relevant information.
        The existing document titles are: ${documentTitles}.
        Do not suggest terms that are too similar to the original query. Provide insightful and diverse suggestions.
        Return the suggestions as a JSON array of strings.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING
                            }
                        }
                    }
                }
            }
        });
        
        if (!response.text) {
            console.warn("Gemini API response was empty for search suggestions.");
            return [];
        }
        
        const parsedJson = JSON.parse(response.text.trim());

        if (parsedJson && Array.isArray(parsedJson.suggestions)) {
            return parsedJson.suggestions;
        }

        return [];

    } catch (error) {
        console.error("Error fetching suggestions from Gemini API:", error);
        throw new Error("Could not retrieve AI suggestions.");
    }
};

export const extractInfoFromDocument = async (fileData: { mimeType: string; data: string }): Promise<ExtractedInfo> => {
    const prompt = `
        You are an AI assistant designed to analyze academic papers and research documents.
        From the provided document, please extract the following information:
        1.  **Title**: The main title of the document. If not found, return an empty string.
        2.  **Authors**: A single string of all authors, separated by commas. If not found, return an empty string.
        3.  **Year**: The publication year as a number. If not found, return 0.
        4.  **Summary**: The abstract or a concise summary of the document. If not found, return an empty string.
        5.  **Publication Title**: The name of the journal, book, or conference where it was published. If not found, return an empty string.
        6.  **Resource Type**: The type of document (e.g., "Journal Article", "Book Chapter", "Report", "Thesis"). If unsure, classify as "General".
        7.  **Subjects**: A single string of 3-5 key subjects or keywords, separated by commas.

        Provide the output in a clean JSON format. Do not include any explanatory text before or after the JSON object.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { text: prompt },
                    {
                        inlineData: {
                            mimeType: fileData.mimeType,
                            data: fileData.data
                        }
                    }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "The main title of the document." },
                        authors: { type: Type.STRING, description: "A single string of all authors, separated by commas." },
                        year: { type: Type.NUMBER, description: "The publication year as a number. 0 if not found." },
                        summary: { type: Type.STRING, description: "The abstract or a concise summary of the document." },
                        publicationTitle: { type: Type.STRING, description: "The name of the journal, book, or conference." },
                        resourceType: { type: Type.STRING, description: 'The type of document (e.g., "Journal Article", "Report").' },
                        subjects: { type: Type.STRING, description: "A single string of key subjects, separated by commas." }
                    }
                }
            }
        });

        if (!response.text) {
            throw new Error("AI response was empty and contained no text.");
        }

        const parsedJson = JSON.parse(response.text.trim());
        
        if (
            parsedJson &&
            typeof parsedJson.title === 'string' &&
            typeof parsedJson.authors === 'string' &&
            typeof parsedJson.summary === 'string' &&
            typeof parsedJson.year === 'number' &&
            typeof parsedJson.publicationTitle === 'string' &&
            typeof parsedJson.resourceType === 'string' &&
            typeof parsedJson.subjects === 'string'
        ) {
            return parsedJson as ExtractedInfo;
        } else {
            throw new Error("AI response did not match the expected format.");
        }

    } catch (error) {
        console.error("Error extracting info from document via Gemini API:", error);
        throw new Error("Could not extract information from the document.");
    }
};

export const simplifySummary = async (summary: string): Promise<string> => {
    const prompt = `
        You are an AI assistant skilled at making complex information accessible.
        The following text is an abstract or summary from a research paper about the school-to-prison pipeline.
        Please rewrite it in simple, clear, layman's terms.
        The rewritten summary should:
        - Be a single paragraph.
        - Avoid jargon and complex statistics.
        - Capture the main point of the original text.

        Original Summary:
        "${summary}"

        Simplified Summary:
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        
        if (!response.text) {
            return summary;
        }
        
        const simplifiedText = response.text.trim();
        
        return simplifiedText || summary;

    } catch (error) {
        console.error("Error simplifying summary with Gemini API:", error);
        return summary;
    }
};
