/**
 * Handwriting Recognition Module
 *
 * Provides handwriting recognition with pluggable providers.
 * Currently uses Google's handwriting API.
 *
 * To swap providers: edit google.ts or create a new implementation
 * and update the exports below.
 */

export type { Stroke, RecognitionResult } from './types';
export { recognizeKanji, isCorrect } from './google';
