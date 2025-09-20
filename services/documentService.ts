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
    doc // Import the 'doc' function
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
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt as Timestamp,
        } as Document;
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