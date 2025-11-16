
import { GoogleGenAI, Type } from "@google/genai";
import type { Document, ExtractedInfo, DiscoveredResearch, Filters } from '../types';

// The API key is read from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const AI_SEARCH_SYSTEM_PROMPT = `
You are the Evidence Assistant inside a specialist web application used by professionals to search, filter and review research on the school to prison pipeline.

Your role is to interpret user queries and existing UI filters, return accurate evidence, and improve the usability of the tool through clear guidance and structured outputs.

Follow the rules below.

---

## **1. How to interpret user input**

Users may interact through:

* natural language queries
* selected filters
* AI suggestion buttons
* combinations of the above

Your job is to:

* understand the user’s intent
* convert their query into a structured evidence search
* use the active filters to refine the results
* return evidence in a clear, professional and factual format

If the user asks vague or broad questions, suggest ways to narrow or clarify the query.

---

## **2. Evidence retrieval and accuracy**

Only return information supported by reputable sources such as:

* peer reviewed articles
* systematic reviews
* meta analyses
* high quality reports (government, official bodies, major research organisations)

Do not generate or guess citations, authors or findings.
If evidence is uncertain or limited, say so clearly.

---

## **3. How to structure results for this app**

When you return evidence, structure each study as a result card containing:

* Title
* Authors
* Publication year
* Type of research (e.g. longitudinal study, systematic review, RCT)
* Population and setting
* Relevant risk factors or interventions
* 3–6 key findings
* Relevance to the school to prison pipeline
* Limitations (if known)
* Citation in APA format

Keep information concise and suitable for scanning inside a results list.

---

## **4. Natural language search behaviour**

If a user types a full sentence (e.g. “show me research on ADHD and school exclusion for teenagers”), you must:

* interpret the meaning
* translate it into clear search parameters
* surface relevant studies
* ignore spelling mistakes, shorthand or informal phrasing

You may propose additional queries if they help the user explore the topic more deeply.

---

## **5. Filter awareness**

The app uses filters such as:

* risk factors
* interventions
* key populations
* resource types
* subjects
* publication year

When filters are active, apply them strictly.
When they conflict with the text query, prioritise the user’s explicit written query but show a short note suggesting the user adjust filters manually.

Explain filters if the user asks, using simple, accessible professional language.

---

## **6. Summaries and synthesis**

When the user requests a summary, synthesis or comparison:

* provide a short narrative overview
* highlight patterns across studies
* outline practical relevance for frontline professionals
* avoid jargon
* avoid overclaiming

Summaries should be neutral, plain British English, with short paragraphs and helpful bullet points.

---

## **7. Suggestions and next steps**

After responding to a query, offer at least two of the following:

* related searches
* broader or narrower variants
* adjacent topics
* methodological alternatives (e.g. systematic reviews only)

This helps users explore the evidence base efficiently.

---

## **8. Behaviour inside the app**

You must:

* never give clinical, legal or safeguarding advice
* never output speculation or opinion
* keep responses concise
* use British English
* avoid em dashes
* support professionals with clear, factual evidence only

If a user assigns a study to their list, simply confirm that action without adding extra commentary.
`;

export const performAISearch = async (
    query: string,
    filters: Filters,
    allDocuments: Document[]
): Promise<string[]> => {
    
    const formatFilterValue = (value: string | string[]): string => {
        if (Array.isArray(value)) return value.join(', ');
        return value;
    }

    const activeFilters = Object.entries(filters)
        .map(([key, value]) => {
            if ((Array.isArray(value) && value.length > 0) || (typeof value === 'string' && value)) {
                // Convert camelCase to Title Case for readability
                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                return `- ${formattedKey}: ${formatFilterValue(value)}`;
            }
            return null;
        })
        .filter(Boolean)
        .join('\n');

    const documentContext = allDocuments.map(doc => ({
        id: doc.id,
        title: doc.title,
        summary: doc.summary,
        year: doc.year,
        resourceType: doc.resourceType,
        keywords: [
            ...doc.authors,
            ...doc.subjects,
            ...doc.riskFactors,
            ...doc.interventions,
            ...doc.keyPopulations,
            ...doc.mentalHealthConditions,
            ...doc.keyOrganisations
        ].filter(Boolean)
    }));

    const userPrompt = `
        A user has submitted a search with the following criteria:

        **Natural Language Query:**
        ${query ? `"${query}"` : "No specific query provided. Rely on the filters."}

        **Active Filters:**
        ${activeFilters || "No filters applied."}

        **Available Documents:**
        Please analyse the user's query and filters against the following list of available documents. Return a ranked list of the IDs of the most relevant documents. Your response MUST be a single, valid JSON object with a key "documentIds" containing an array of the matching document IDs. For example: { "documentIds": ["doc1-id", "doc3-id"] }.

        ${JSON.stringify(documentContext, null, 2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: userPrompt,
            config: {
                systemInstruction: AI_SEARCH_SYSTEM_PROMPT,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        documentIds: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING,
                                description: "The unique ID of a matching document."
                            }
                        }
                    },
                    required: ["documentIds"]
                }
            }
        });
        
        if (!response.text) {
            console.warn("Gemini API response was empty for AI search.");
            return [];
        }
        
        const parsedJson = JSON.parse(response.text.trim());
        if (parsedJson && Array.isArray(parsedJson.documentIds)) {
            return parsedJson.documentIds;
        }

        return [];

    } catch (error) {
        console.error("Error performing AI search with Gemini API:", error);
        throw new Error("Could not perform AI-powered search.");
    }
};


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
        9.  **Key Populations**: A single string of specific demographic or population groups discussed (e.g., students of colour, students with disabilities, low-income students), separated by commas.
        10. **Mental Health or Neurodivergent Conditions**: A single string of specific conditions mentioned (e.g., ADHD, anxiety, trauma, autism spectrum disorder), separated by commas.
        11. **Interventions**: A single string of interventions or practices discussed (e.g., restorative justice, policy reform, teacher training), separated by commas.
        12. **Key Stats**: A single string of 2-3 key statistics or quantitative findings from the paper, separated by commas.
        13. **Key Organisations**: A single string of specific schools, institutions, or organisations mentioned, separated by commas.
        14. **Location**: The primary city and country where the research was conducted (e.g., "London, UK"). If not specified, return an empty string.

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
                        mentalHealthConditions: { type: Type.STRING, description: "Mental health or neurodivergent conditions as a comma-separated string." },
                        interventions: { type: Type.STRING, description: "Interventions or practices as a comma-separated string." },
                        keyStats: { type: Type.STRING, description: "Key statistics as a comma-separated string." },
                        keyOrganisations: { type: Type.STRING, description: "Key organisations as a comma-separated string." },
                        location: { type: Type.STRING, description: "The city and country where the research was conducted." }
                    }
                }
            }
        });

        if (!response.text) {
            throw new Error("AI response was empty and contained no text.");
        }

        const parsedJson = JSON.parse(response.text.trim());
        
        // Basic type-checking to ensure the AI response is in the expected format
        if (
            parsedJson &&
            typeof parsedJson.title === 'string' &&
            typeof parsedJson.authors === 'string' &&
            typeof parsedJson.summary === 'string' &&
            typeof parsedJson.year === 'number' &&
            typeof parsedJson.location === 'string'
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
