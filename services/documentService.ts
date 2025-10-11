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
    deleteDoc,
    type DocumentData,
} from "firebase/firestore";

const DOCUMENTS_COLLECTION = 'documents';

/**
 * A robust function to transform raw Firestore data into a clean, type-safe Document object.
 * This prevents runtime errors by ensuring all expected fields exist and have the correct type.
 * @param id - The Firestore document ID.
 * @param data - The raw data from doc.data().
 * @returns A sanitized Document object with safe defaults.
 */
const hydrateDocument = (id: string, data: DocumentData): Document => {
  const cleanArray = (arr: unknown): string[] => {
    if (!Array.isArray(arr)) return [];
    // Ensure all items in the array are non-empty strings
    return arr.filter((item): item is string => typeof item === 'string' && item.length > 0);
  };

  return {
    id,
    title: typeof data.title === 'string' ? data.title : '',
    authors: cleanArray(data.authors),
    summary: typeof data.summary === 'string' ? data.summary : '',
    simplifiedSummary: typeof data.simplifiedSummary === 'string' ? data.simplifiedSummary : '',
    year: typeof data.year === 'number' ? data.year : undefined,
    createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.now(),
    resourceType: typeof data.resourceType === 'string' ? data.resourceType : '',
    subjects: cleanArray(data.subjects),
    publicationTitle: typeof data.publicationTitle === 'string' ? data.publicationTitle : '',
    pdfUrl: typeof data.pdfUrl === 'string' ? data.pdfUrl : '',
    interventions: cleanArray(data.interventions),
    keyPopulations: cleanArray(data.keyPopulations),
    riskFactors: cleanArray(data.riskFactors),
    mentalHealthConditions: cleanArray(data.mentalHealthConditions),
    keyStats: cleanArray(data.keyStats),
    keyOrganisations: cleanArray(data.keyOrganisations),
  };
};

/**
 * Seeds the Firestore database with initial mock documents if the collection is empty.
 */
const seedDatabase = async () => {
    const batch = writeBatch(db);
    const documentsCollectionRef = collection(db, DOCUMENTS_COLLECTION);

    MOCK_DOCUMENTS.forEach(mockDoc => {
        const docWithTimestamp = { ...mockDoc, createdAt: serverTimestamp() };
        const newDocRef = doc(documentsCollectionRef);
        batch.set(newDocRef, docWithTimestamp);
    });

    await batch.commit();
};

/**
 * Retrieves documents from Firestore, ordered by creation date.
 * If the collection is empty, it seeds the database with mock data.
 * @returns A Promise that resolves to an array of sanitized documents.
 */
export const getDocuments = async (): Promise<Document[]> => {
  try {
    const documentsCollection = collection(db, DOCUMENTS_COLLECTION);
    const q = query(documentsCollection, orderBy("createdAt", "desc"));
    
    let querySnapshot = await getDocs(q);

    // If the database is empty, seed it and refetch
    if (querySnapshot.empty) {
        console.log("Database is empty. Seeding with mock documents...");
        await seedDatabase();
        querySnapshot = await getDocs(q);
    }
    
    // Use the hydrateDocument function to ensure all data is clean and safe
    const documents = querySnapshot.docs.map(doc => hydrateDocument(doc.id, doc.data()));

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
    const docWithTimestamp = { ...newDocument, createdAt: serverTimestamp() };
    const docRef = await addDoc(collection(db, DOCUMENTS_COLLECTION), docWithTimestamp);
    
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