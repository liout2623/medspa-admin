/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Coze AI Bot Personal Access Token */
  readonly VITE_COZE_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
