// The triple-slash directive was removed to fix a "Cannot find type definition file for 'vite/client'" error.
// This issue typically stems from the TypeScript configuration. We are defining the required types directly instead.

// The app has been updated to use `process.env` for environment variables instead of `import.meta.env`
// to work around a build-time issue. The manual definitions for ImportMeta have been removed.

// FIX: Type definition for all environment variables injected by Vite.
// We augment the existing `NodeJS.ProcessEnv` interface. This adds the
// properties to `process.env` without causing a type conflict.
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
