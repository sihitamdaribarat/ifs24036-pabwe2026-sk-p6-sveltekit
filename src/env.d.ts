/// <reference types="vite/client" />

declare const DELCOM_BASEURL: string;

interface ImportMetaEnv {
  readonly VITE_DELCOM_BASEURL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
