// FIX: Removed the reference to "vite/client" to resolve a type definition error.
// The project's custom `process.env` types are defined below.

declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
    VITE_FIREBASE_API_KEY: string;
    VITE_FIREBASE_AUTH_DOMAIN: string;
    VITE_FIREBASE_PROJECT_ID: string;
    VITE_FIREBASE_STORAGE_BUCKET: string;
    VITE_FIREBASE_MESSAGING_SENDER_ID: string;
    VITE_FIREBASE_APP_ID: string;
  }
}
