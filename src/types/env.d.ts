/// <reference types="vite/client" />

/**
 * Typed so a missing WebSocket variable is a build error rather than a runtime
 * `undefined` that quietly connects to port NaN.
 */
interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_API_URL: string
  readonly VITE_REVERB_KEY: string
  readonly VITE_WS_HOST: string
  readonly VITE_WS_PORT: string
  readonly VITE_WS_SCHEME: 'http' | 'https'
  readonly VITE_ENABLE_ASSISTANT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
