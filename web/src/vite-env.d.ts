/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA: 'mock' | 'engine';
  readonly VITE_API?: string;
}
