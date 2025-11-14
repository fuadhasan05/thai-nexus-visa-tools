// Declarations for third-party modules that ship TypeScript sources or cause JSX namespace issues
// Treat these as any so the project's TypeScript check doesn't attempt to compile their .ts sources.
declare module 'react-markdown';
declare module 'react-quill';
declare module 'react-leaflet';
declare module 'leaflet';
declare module 'lucide-react';

// Fallback for other modules without types
declare module '*';
