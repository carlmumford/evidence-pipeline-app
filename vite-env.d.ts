// The triple-slash directive was removed to fix a "Cannot find type definition file for 'vite/client'" error.
// This issue typically stems from the TypeScript configuration. We are defining the required types directly instead.

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// FIX: Type definition for process.env.API_KEY, which is injected by Vite.
// Instead of redeclaring `process`, which conflicts with global Node.js types,
// we augment the existing `NodeJS.ProcessEnv` interface. This adds the
// `API_KEY` property to `process.env` without causing a type conflict.
declare namespace NodeJS {
  interface ProcessEnv {
    API_KEY: string;
  }
}
