
import { GoogleGenAI, Type } from "@google/genai";
import type { Document, ExtractedInfo, DiscoveredResearch } from '../types';

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
        The suggestions should be in British English.
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
        You are an AI assistant designed to analyse academic papers and research documents related to the school-to-prison pipeline.
        From the provided document, please extract the following information. Please use British English spelling (e.g., 'organisation', 'centre', 'analyse').
        1.  **Title**: The main title of the document. If not found, return an empty string.
        2.  **Authors**: A single string of all authors, separated by commas. If not found, return an empty string.
        3.  **Year**: The publication year as a number. If not found, return 0.
        4.  **Summary**: The abstract or a concise summary of the document. If not found, return an empty string.
        5.  **Publication Title**: The name of the journal, book, or conference where it was published. If not found, return an empty string.
        6.  **Resource Type**: The type of document (e.g., "Journal Article", "Book Chapter", "Report", "Thesis"). If unsure, classify as "General".
        7.  **Subjects**: A single string of 3-5 general key subjects or keywords, separated by commas.
        8.  **Risk Factors**: A single string of 3-5 key risk factors mentioned (e.g., poverty, neurodiversity, exclusion rates, zero tolerance policies), separated by commas.
        9.  **Key Populations**: A single string of specific demographic or population groups discussed (e.g., students of colour, students with disabilities, low-income students, ADHD), separated by commas.
        10. **Interventions**: A single string of interventions or practices discussed (e.g., restorative justice, policy reform, teacher training), separated by commas.
        11. **Key Stats**: A single string of 2-3 key statistics or quantitative findings from the paper, separated by commas.
        12. **Key Organisations**: A single string of specific schools, institutions, or organisations mentioned, separated by commas.

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
                        subjects: { type: Type.STRING, description: "A single string of key subjects, separated by commas." },
                        riskFactors: { type: Type.STRING, description: "Key risk factors as a comma-separated string." },
                        keyPopulations: { type: Type.STRING, description: "Key populations as a comma-separated string." },
                        interventions: { type: Type.STRING, description: "Interventions or practices as a comma-separated string." },
                        keyStats: { type: Type.STRING, description: "Key statistics as a comma-separated string." },
                        keyOrganisations: { type: Type.STRING, description: "Key organisations as a comma-separated string." }
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
            typeof parsedJson.subjects === 'string' &&
            typeof parsedJson.riskFactors === 'string' &&
            typeof parsedJson.keyPopulations === 'string' &&
            typeof parsedJson.interventions === 'string' &&
            typeof parsedJson.keyStats === 'string' &&
            typeof parsedJson.keyOrganisations === 'string'
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
        - Use British English spelling.

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


export const findRecentResearch = async (): Promise<DiscoveredResearch[]> => {
    const prompt = `
        You are an expert research assistant. Find the 5 most recent and relevant research articles about the 'school-to-prison pipeline' from popular academic and research websites (like JSTOR, Google Scholar, university sites, research institutes).
        For each article, provide the title, a direct URL to the article page or PDF, the authors as a comma-separated string, a concise one-paragraph summary, and a confidence score (from 1 to 100) indicating how directly it relates to the school-to-prison pipeline.
        The summary for each article should be in British English.
        Return your findings as a valid JSON array of objects. Each object should have keys: "title", "url", "authors", "summary", "confidenceScore".
        Do not include any text before or after the JSON array.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        if (!response.text) {
            throw new Error("AI response was empty.");
        }

        // Clean and parse the JSON response from the text
        let researchList: DiscoveredResearch[];
        try {
            // Find the start of the JSON array
            const jsonString = response.text.substring(response.text.indexOf('['));
            researchList = JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse JSON from AI response:", response.text);
            throw new Error("AI returned a malformed response.");
        }
        
        // As per guidelines, extract and attach grounding metadata
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources = groundingChunks?.map(chunk => chunk.web).filter(Boolean) as { uri: string; title: string }[] || [];

        // Attach all found sources to the first research item for display
        if (researchList.length > 0) {
            researchList[0].sources = sources;
        }

        return researchList;
    } catch (error) {
        console.error("Error finding recent research with Gemini API:", error);
        throw new Error("Could not find recent research.");
    }
};