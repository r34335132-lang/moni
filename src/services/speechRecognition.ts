/**
 * Safe wrapper around expo-speech-recognition.
 * The native module is NOT available in Expo Go — importing it crashes the app.
 * Always load via this helper (never static-import the package from screens).
 */

type SpeechModule = typeof import('expo-speech-recognition');

let cached: SpeechModule | null | undefined;

function loadSpeechModule(): SpeechModule | null {
  if (cached !== undefined) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('expo-speech-recognition') as SpeechModule;
    // Touch the module once — requireNativeModule throws if missing.
    if (!mod?.ExpoSpeechRecognitionModule) {
      cached = null;
      return null;
    }
    void mod.ExpoSpeechRecognitionModule;
    cached = mod;
    return mod;
  } catch {
    cached = null;
    return null;
  }
}

export function isSpeechRecognitionAvailable(): boolean {
  return loadSpeechModule() != null;
}

export function getSpeechRecognitionModule() {
  return loadSpeechModule()?.ExpoSpeechRecognitionModule ?? null;
}

export type SpeechResultEvent = {
  isFinal?: boolean;
  results?: Array<{ transcript?: string } | undefined>;
};

/** Subscribe to speech events without importing the package at module top-level. */
export function addSpeechRecognitionListener(
  event: 'result' | 'error' | 'end' | 'start',
  listener: (event: SpeechResultEvent) => void,
): { remove: () => void } {
  const mod = loadSpeechModule();
  if (!mod) return { remove: () => undefined };
  return mod.ExpoSpeechRecognitionModule.addListener(event as never, listener as never);
}
