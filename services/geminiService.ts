

import { GoogleGenAI, Type } from "@google/genai";
import type { Document, ExtractedInfo, DiscoveredResearch } from '../types';

// The API key is read from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSearchSuggestions = async (query: string, existingDocuments: Document[]): Promise<string[]> => {
    const documentTitles = existingDocuments.map(doc => doc.title).join(', ');

    const prompt = `
        You are an AI research assistant for the 'School to Prison Pipeline Evidence Project'.
        A user is searching for "${query}".
        
        GOAL: Help the user refine their search with high-quality, academic, or policy-relevant terms.

        GUIDELINES:
        1. **Refine & Expand**: Acknowledge the user's intent. If they search for a broad term (e.g., "suspension"), suggest specific angles like "disproportionate suspension rates" or "exclusionary discipline impacts".
        2. **Pipeline Context**: If the query relates to a specific stage (School Environment, Discipline, Justice System, Incarceration), suggest terms that link this stage to the pipeline progression or adjacent stages.
        3. **Diversity**: Suggest a mix of risk factors, interventions, and specific populations based on the context of our existing library.
        
        Context from our database titles: ${documentTitles}.
        
        Do not suggest terms that are too similar to the original query. Provide insightful suggestions in British English.
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
        If a field is not found, return an empty string, or 0 for the year.

        1.  **Title**: The main title of the document.
        2.  **Authors**: A single string of all authors, separated by commas.
        3.  **Year**: The publication year as a number.
        4.  **Summary**: The original abstract of the document.
        5.  **Publication Title**: The name of the journal, book, or conference where it was published.
        6.  **Resource Type**: The type of document (e.g., "Journal Article", "Book Chapter", "Report", "Thesis").
        7.  **Strength of Evidence**: The study type (e.g., "Systematic Review", "Randomised Controlled Trial", "Meta-analysis", "Observational Study", "Qualitative Study", "Grey Literature").
        8.  **Aim**: A concise sentence describing the main objective of the study.
        9.  **Population**: A brief description of the study's participants or sample.
        10. **Sample Size**: The total number of participants or units in the study (e.g., "N=250 students", "5 schools").
        11. **Methods**: A brief summary of the research methodology used.
        12. **Key Findings**: 2-3 bullet points of the most important results. Explicitly link risk factors to outcomes or interventions where the text supports it. Return as a single string with points separated by a semicolon ';'.
        13. **Implications**: A concise sentence on the practical implications or takeaways from the study.
        14. **Subjects**: A single string of 3-5 general key subjects or keywords, separated by commas.
        15. **Risk Factors**: A single string of 3-5 key risk factors mentioned (e.g., poverty, neurodiversity, exclusion rates, zero tolerance policies), separated by commas.
        16. **Key Populations**: A single string of specific demographic or population groups discussed (e.g., students of colour, students with disabilities, low-income students), separated by commas.
        17. **Mental Health or Neurodivergent Conditions**: A single string of specific conditions mentioned (e.g., ADHD, anxiety, trauma, autism spectrum disorder), separated by commas.
        18. **Interventions**: A single string of interventions or practices discussed (e.g., restorative justice, policy reform, teacher training), separated by commas.
        19. **Key Stats**: A single string of 2-3 key statistics or quantitative findings from the paper, separated by commas.
        20. **Key Organisations**: A single string of specific schools, institutions, or organisations mentioned, separated by commas.
        21. **Location**: The primary city and country where the research was conducted (e.g., "London, UK").

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
                        title: { type: Type.STRING },
                        authors: { type: Type.STRING },
                        year: { type: Type.NUMBER },
                        summary: { type: Type.STRING },
                        publicationTitle: { type: Type.STRING },
                        resourceType: { type: Type.STRING },
                        strengthOfEvidence: { type: Type.STRING },
                        aim: { type: Type.STRING },
                        population: { type: Type.STRING },
                        sampleSize: { type: Type.STRING },
                        methods: { type: Type.STRING },
                        keyFindings: { type: Type.STRING },
                        implications: { type: Type.STRING },
                        subjects: { type: Type.STRING },
                        riskFactors: { type: Type.STRING },
                        keyPopulations: { type: Type.STRING },
                        mentalHealthConditions: { type: Type.STRING },
                        interventions: { type: Type.STRING },
                        keyStats: { type: Type.STRING },
                        keyOrganisations: { type: Type.STRING },
                        location: { type: Type.STRING }
                    }
                }
            }
        });

        if (!response.text) {
            throw new Error("AI response was empty and contained no text.");
        }

        const parsedJson = JSON.parse(response.text.trim());
        
        // A simple validation to ensure the response is in a usable state
        if (
            parsedJson &&
            typeof parsedJson.title === 'string' &&
            typeof parsedJson.authors === 'string' &&
            typeof parsedJson.year === 'number'
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
        You are an AI assistant skilled at making complex research accessible.
        The following text is an abstract or summary from a research paper about the school-to-prison pipeline.
        Please rewrite it in simple, clear terms.

        REQUIREMENTS:
        1. **Structure**: Use a clear, accessible paragraph.
        2. **Content**: Explicitly mention the study's methodology (e.g., "Using interviews with..."), the specific population (e.g., "students in..."), and location if available in the text.
        3. **Goal**: Capture the main point and any key quality indicators (e.g., "This systematic review finds...").
        4. **Tone**: Professional but easy to read. Use British English spelling.

        Original Summary:
        "${summary}"

        Simplified Summary:
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        
        const simplifiedText = response.text?.trim();
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
        Your entire response MUST be a single, valid JSON array of objects. Each object in the array should represent one research article and have the keys "title", "url", "authors", "summary", and "confidenceScore".
        Do not include any introductory text, closing text, or markdown formatting like \`\`\`json. Your response must start with '[' and end with ']'.
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

        let researchList: DiscoveredResearch[];
        try {
            let jsonString = response.text.trim();
            
            // Handle markdown code blocks just in case
            const markdownMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (markdownMatch && markdownMatch[1]) {
                jsonString = markdownMatch[1].trim();
            }

            // The model is instructed to return only JSON. If it doesn't, try to recover.
            if (!jsonString.startsWith('[') || !jsonString.endsWith(']')) {
                console.warn("AI response was not a clean JSON array. Attempting to recover.");
                const startIndex = jsonString.indexOf('[');
                const endIndex = jsonString.lastIndexOf(']');

                if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
                    jsonString = jsonString.substring(startIndex, endIndex + 1);
                } else {
                    throw new Error("Could not find a valid JSON array in the response.");
                }
            }
            
            researchList = JSON.parse(jsonString);

        } catch (e) {
            console.error("Failed to parse JSON from AI response. Raw text:", response.text, "Error:", e);
            throw new Error("AI returned a malformed response.");
        }
        
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        const sources = groundingChunks?.map(chunk => chunk.web).filter(Boolean) as { uri: string; title: string }[] || [];

        if (researchList.length > 0 && sources.length > 0) {
            researchList[0].sources = sources;
        }

        return researchList;
    } catch (error) {
        console.error("Error finding recent research with Gemini API:", error);
        throw new Error("Could not find recent research.");
    }
};

export const normalizeFilterTerms = async (
    categoriesWithTerms: Record<string, string[]>
): Promise<Record<string, Record<string, string>>> => {
    const prompt = `
        You are an AI assistant specializing in social science research and data normalization. Your task is to consolidate similar or synonymous filter terms into a single, representative term for better user experience.

        For each category provided below, analyse the list of terms. Group together terms that are semantically similar, plural/singular variations, or refer to the same concept. For each group, choose one single, clear, and representative name (the "canonical term"). Use British English spelling where appropriate.

        For example, within 'Key Populations', terms like "Black Students" and "Black Youth" should be grouped under a single canonical term like "Black Youth". Within 'Risk Factors', "Zero Tolerance Policies" and "zero-tolerance policies" should be grouped under "Zero Tolerance Policies".

        Return your response as a single, valid JSON object. The keys of this object should be the category names I provide. The value for each category key should be another JSON object that serves as a mapping, where each key is an original term from my list (converted to lowercase) and its value is the chosen canonical term (with proper casing).

        Every single original term provided must be present as a key in the mapping for its respective category.

        Here are the categories and terms:
        ${JSON.stringify(categoriesWithTerms, null, 2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        if (!response.text) {
            throw new Error("AI response was empty for term normalization.");
        }

        const parsedJson = JSON.parse(response.text.trim());
        
        if (typeof parsedJson === 'object' && parsedJson !== null && !Array.isArray(parsedJson)) {
            return parsedJson as Record<string, Record<string, string>>;
        } else {
             throw new Error("AI response for term normalization was not in the expected object format.");
        }

    } catch (error) {
        console.error("Error normalizing filter terms with Gemini API:", error);
        // Fallback: return a mapping that doesn't change anything
        const fallbackMapping: Record<string, Record<string, string>> = {};
        for (const category in categoriesWithTerms) {
            fallbackMapping[category] = {};
            categoriesWithTerms[category].forEach(term => {
                fallbackMapping[category][term.toLowerCase()] = term;
            });
        }
        return fallbackMapping;
    }
};

export const analyzeSavedCollection = async (documents: Document[]): Promise<string> => {
    if (documents.length === 0) return "No documents to analyze.";

    // Create a context string from the documents
    const context = documents.map(d => 
        `Title: ${d.title}\nSummary: ${d.simplifiedSummary}\nRisk Factors: ${d.riskFactors.join(', ')}\nInterventions: ${d.interventions.join(', ')}`
    ).join('\n---\n');

    const prompt = `
        You are the research lead for the School to Prison Pipeline Evidence Project.
        Analyze the following collection of saved documents from a user's reading list:

        ${context}

        Provide a structured insight report (in clear text or Markdown) covering:
        1. **Identified Patterns**: What common themes, risk factors, or specific interventions appear consistently across these studies?
        2. **Missing Perspectives**: Are there key pipeline stages (e.g., early years vs. juvenile justice), populations, or geographic regions that are missing or under-represented in this list?
        3. **Suggested Directions**: Based on this specific collection, what topics or search terms should the user explore next to round out their evidence base?

        Be concise (approx. 150-200 words), helpful, and evidence-focused. Use British English.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        
        return response.text?.trim() || "Could not generate analysis.";

    } catch (error) {
        console.error("Error analyzing saved collection with Gemini API:", error);
        return "Sorry, I couldn't analyze your collection at this time.";
    }
};
