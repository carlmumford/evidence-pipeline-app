import type { Document } from '../types';
import { MOCK_DOCUMENTS } from '../constants';
import { db } from './firebaseConfig';
import { 
    collection, 
    getDocs, 
    addDoc, 
    serverTimestamp,
    query,
    orderBy,
    writeBatch,
    Timestamp,
    doc,
    deleteDoc
} from "firebase/firestore";

const DOCUMENTS_COLLECTION = 'documents';

/**
 * Seeds the Firestore database with initial mock documents if the collection is empty.
 * This is a one-time operation.
 */
const seedDatabase = async () => {
    const batch = writeBatch(db);
    const documentsCollectionRef = collection(db, DOCUMENTS_COLLECTION);

    MOCK_DOCUMENTS.forEach(mockDoc => {
        const docWithTimestamp = {
            ...mockDoc,
            authors: mockDoc.authors,
            createdAt: serverTimestamp()
        };
        // Create a new document reference with an auto-generated ID for use in the batch
        const newDocRef = doc(documentsCollectionRef);
        batch.set(newDocRef, docWithTimestamp);
    });

    await batch.commit();
};

/**
 * A helper function to sanitize array data from Firestore.
 * It ensures the value is an array and filters out any non-string or empty values.
 * @param arr - The value from Firestore, which could be anything.
 * @returns A clean array of strings.
 */
const cleanArray = (arr: any): string[] => {
    if (!Array.isArray(arr)) return [];
    // FIX: The filter predicate with a type guard must return a boolean. The original `&& item` could return a string.
    // Using `Boolean(item)` explicitly converts the truthy/falsy check to a boolean value.
    return arr.filter((item): item is string => typeof item === 'string' && Boolean(item));
};


/**
 * Retrieves documents from Firestore, ordered by creation date.
 * If the collection is empty, it seeds the database with mock data.
 * @returns A Promise that resolves to an array of documents.
 */
export const getDocuments = async (): Promise<Document[]> => {
  try {
    const documentsCollection = collection(db, DOCUMENTS_COLLECTION);
    const q = query(documentsCollection, orderBy("createdAt", "desc"));
    
    let querySnapshot = await getDocs(q);

    // If the database is empty, seed it and refetch
    if (querySnapshot.empty) {
        await seedDatabase();
        querySnapshot = await getDocs(q);
    }
    
    const documents = querySnapshot.docs.map(doc => {
        const data = doc.data();
        // Defensively sanitize all fields, especially arrays, to prevent
        // crashes from malformed data in Firestore.
        const finalDoc = {
            id: doc.id,
            title: data.title || '',
            authors: cleanArray(data.authors),
            summary: data.summary || '',
            simplifiedSummary: data.simplifiedSummary || '',
            year: data.year,
            createdAt: data.createdAt as Timestamp,
            resourceType: data.resourceType || '',
            subjects: cleanArray(data.subjects),
            publicationTitle: data.publicationTitle || '',
            pdfUrl: data.pdfUrl || '',
            interventions: cleanArray(data.interventions),
            keyPopulations: cleanArray(data.keyPopulations),
            riskFactors: cleanArray(data.riskFactors),
            keyStats: cleanArray(data.keyStats),
            keyOrganisations: cleanArray(data.keyOrganisations),
        } as Document;

        // --- START: Added for Debugging ---
        // This log helps inspect the raw data from Firestore vs. the cleaned data.
        // If the error persists, check the console for a document where an expected
        // array field (like 'subjects' or 'authors') is missing or not an array in the 'raw' object.
        console.log(`[DEBUG] Processing Doc ID: ${doc.id}`, { raw: data, cleaned: finalDoc });
        // --- END: Added for Debugging ---

        return finalDoc;
    });

    return documents;

  } catch (error) {
    console.error("Could not retrieve documents from Firestore:", error);
    throw new Error("Failed to fetch documents from the database.");
  }
};

/**
 * Adds a new document to Firestore.
 * @param newDocument - The document to add, without an ID or createdAt timestamp.
 * @returns A Promise that resolves to the newly created document with an ID.
 */
export const addDocument = async (newDocument: Omit<Document, 'id' | 'createdAt'>): Promise<Document> => {
  try {
    const docWithTimestamp = {
        ...newDocument,
        createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, DOCUMENTS_COLLECTION), docWithTimestamp);
    
    // Return the newly created document with a client-side timestamp for immediate UI update.
    // The server will have the authoritative timestamp.
    return {
        ...newDocument,
        id: docRef.id,
        createdAt: Timestamp.now()
    };

  } catch (error) {
    console.error("Could not add document to Firestore:", error);
    throw new Error("Failed to save the new document.");
  }
};

/**
 * Deletes a document from Firestore.
 * @param id - The ID of the document to delete.
 */
export const deleteDocument = async (id: string): Promise<void> => {
    try {
        const docRef = doc(db, DOCUMENTS_COLLECTION, id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Could not delete document from Firestore:", error);
        throw new Error("Failed to delete the document.");
    }
};