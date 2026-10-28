import type { AppData, NativeMessage } from './types';

declare global {
  interface Window {
    /** Injected by scripts/build_page.py. */
    APP_DATA: AppData;
    /** BRouter profile sources with the cycleway_priority parameter, keyed by base profile. */
    APP_BRF: Record<string, string>;
    /** Present when running inside the macOS app (WKWebView). */
    webkit?: { messageHandlers?: { native?: { postMessage(message: NativeMessage): void } } };
    /** Called by the macOS app with CoreLocation fixes. */
    __loc?: (lat: number, lng: number, accuracy: number) => void;
    __locErr?: (code: number, message: string) => void;
    /** Called by the macOS app after saving a GPX file. */
    toast?: (message: string, ms?: number) => void;
  }
}

export {};
