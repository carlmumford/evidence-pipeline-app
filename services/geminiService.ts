import { GoogleGenAI, Type } from "@google/genai";
import type { Document, ExtractedInfo, DiscoveredResearch } from '../types';

// The API key is read from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSearchSuggestions = async (query: string, existingDocuments: Document[]): Promise<string[]> => {
    // 1. Extract the "Valid Vocabulary" from the actual database
    const vocabulary = new Set<string>();
    existingDocuments.forEach(doc => {
        doc.subjects.forEach(s => vocabulary.add(s));
        doc.riskFactors.forEach(r => vocabulary.add(r));
        doc.interventions.forEach(i => vocabulary.add(i));
        doc.keyPopulations.forEach(k => vocabulary.add(k));
        // Add authors as well
        doc.authors.forEach(a => vocabulary.add(a));
    });

    // Convert to array and limit to prevent token overflow (e.g., top 200 distinct terms)
    const validTerms = Array.from(vocabulary).slice(0, 200).join(', ');

    const prompt = `
        You are an expert AI research assistant for the 'School to Prison Pipeline Evidence Project'.
        A user is searching for: "${query}".
        
        GOAL: Suggest 3-5 precise search terms that will help the user find documents in OUR SPECIFIC DATABASE.

        CRITICAL CONSTRAINT:
        Below is a list of "Valid Vocabulary" that actually exists in our database (subjects, risk factors, authors, etc.).
        **You MUST prioritize suggesting terms that appear in this list.** 
        Only suggest a term NOT in this list if it is a very close synonym to a term that likely exists in academic literature about this topic.

        Valid Vocabulary (Database Content):
        [${validTerms}]

        GUIDELINES:
        1. If the user types a vague term (e.g. "bad kids"), map it to a Valid Vocabulary term (e.g. "exclusion", "challenging behaviour").
        2. Do not suggest specific years or generic words like "the".
        3. Return the suggestions as a JSON array of strings.
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
        
        TASK: Extract structured data from the provided document.
        
        GUIDELINES for Summary & Analysis:
        1. **Study Methodology**: Explicitly identify the design (e.g., Longitudinal, Cross-sectional, Qualitative Interview).
        2. **Population**: Be specific about who was studied (e.g., "Black male students in urban high schools").
        3. **Location**: Identify the geographic setting.
        4. **Pipeline Alignment**: In 'Key Findings', explicitly link risk factors or interventions to specific stages of the pipeline (School, Discipline, Justice, Incarceration).
        5. **Accuracy**: Do not invent data or citations. Only rely on the content displayed in the document.
        
        Please use British English spelling. If a field is not found, return an empty string, or 0 for the year.

        FIELDS TO EXTRACT:
        1.  **Title**: Main title.
        2.  **Authors**: Comma-separated string.
        3.  **Year**: Number.
        4.  **Summary**: Original abstract.
        5.  **Publication Title**: Journal/Book name.
        6.  **Resource Type**: e.g., "Journal Article", "Report".
        7.  **Strength of Evidence**: e.g., "Systematic Review", "RCT", "Observational".
        8.  **Aim**: Concise objective.
        9.  **Population**: Description of participants.
        10. **Sample Size**: e.g., "N=250".
        11. **Methods**: Brief methodology summary.
        12. **Key Findings**: 2-3 bullet points, separated by semicolons. Ensure links between risk factors and pipeline stages are clear.
        13. **Implications**: Practical takeaways for policy or practice.
        14. **Subjects**: 3-5 keywords, comma-separated.
        15. **Risk Factors**: 3-5 key risks, comma-separated.
        16. **Key Populations**: Specific groups, comma-separated.
        17. **Mental Health or Neurodivergent Conditions**: Specific conditions, comma-separated.
        18. **Interventions**: Specific practices/reforms, comma-separated.
        19. **Key Stats**: 2-3 quantitative findings, comma-separated.
        20. **Key Organisations**: Institutions mentioned, comma-separated.
        21. **Location**: City/Country.

        Provide the output in a clean JSON format.
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
        You are an expert research assistant for the School to Prison Pipeline Evidence Project.
        
        TASK: Rewrite the following abstract into a simplified, rich summary.
        
        REQUIREMENTS:
        1. **Structure**: Use a clear, accessible paragraph.
        2. **Key Details**: You MUST include the Study Methodology (e.g., "Using interviews..."), the Population studied, and the Location (if identifiable).
        3. **Pipeline Insight**: Briefly explain how this evidence fits into the school-to-prison pipeline (e.g., "This highlights how early suspension contributes to justice involvement").
        4. **Tone**: Professional, British English, accessible to policymakers and educators.
        
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
        For each article, provide the title, a direct URL to the article page or PDF, the authors as a comma-separated string, a concise one-paragraph summary (including population and methodology where possible), and a confidence score (from 1 to 100).
        Use British English.
        
        Your entire response MUST be a single, valid JSON array of objects. Each object in the array should represent one research article and have the keys "title", "url", "authors", "summary", and "confidenceScore".
        Do not include any introductory text, closing text, or markdown formatting.
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
            
            const markdownMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (markdownMatch && markdownMatch[1]) {
                jsonString = markdownMatch[1].trim();
            }

            if (!jsonString.startsWith('[') || !jsonString.endsWith(']')) {
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
            console.error("Failed to parse JSON from AI response.", e);
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
        You are an AI assistant specializing in data normalization.
        Task: Consolidate similar/synonymous filter terms into single canonical terms.
        Use British English.
        
        Example: "Black Students", "Black Youth", "African American students" -> "Black Youth".
        
        Return a JSON object where keys are category names, and values are objects mapping 'original term (lowercase)' -> 'Canonical Term'.

        Categories:
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
            throw new Error("AI response was empty.");
        }

        const parsedJson = JSON.parse(response.text.trim());
        return parsedJson as Record<string, Record<string, string>>;

    } catch (error) {
        console.error("Error normalizing filter terms:", error);
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

    // Construct a rich context string using available metadata
    const context = documents.map(d => 
        `---
        Title: ${d.title}
        Year: ${d.year || 'N/A'}
        Summary: ${d.simplifiedSummary}
        Methods: ${d.methods || 'N/A'}
        Population: ${d.population || d.keyPopulations.join(', ') || 'N/A'}
        Location: ${d.location || 'N/A'}
        Risk Factors: ${d.riskFactors.join(', ')}
        Interventions: ${d.interventions.join(', ')}
        ---`
    ).join('\n');

    const prompt = `
        You are the Research Lead for the School to Prison Pipeline Evidence Project.
        
        TASK: Analyze the user's saved reading list.
        
        ACCURACY RULES:
        1. Only use the provided documents.
        2. Do not invent findings.
        
        OUTPUT REQUIREMENTS:
        Provide a structured report (in Markdown) with the following sections:
        
        1. **Identified Patterns**: 
           - What are the dominant themes? 
           - Are there recurring risk factors or specific interventions appearing across these studies?
           
        2. **Pipeline Coverage**:
           - Which stages of the pipeline are well-represented (School environment, Discipline, Justice System, Incarceration)?
           - How do the findings in this list connect to each other?
           
        3. **Missing Perspectives (Gaps)**:
           - Are there key populations, geographic regions, or methodology types (e.g., quantitative vs qualitative) missing from this list?
           
        4. **Suggested Further Reading**:
           - Based *specifically* on the gaps identified, suggest 2-3 topics or search terms the user should explore next.
           
        Use British English. Keep it concise (approx. 250 words) but insightful.

        DOCUMENTS TO ANALYZE:
        ${context}
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