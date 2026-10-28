import type { NativeMessage } from './types';

// Bridge to the macOS app (app/Sources/main.swift). In a browser it is absent
// and the page falls back to the Geolocation API and blob downloads.
const handler = window.webkit?.messageHandlers?.native;

export const isNative = !!handler;

export function postNative(message: NativeMessage): void {
  handler?.postMessage(message);
}
