import type { Stroke, RecognitionResult } from './types';

const ENDPOINT = 'https://inputtools.google.com/request?itc=ja-t-i0-handwrit&app=translate';

interface GoogleRequest {
	app_version: number;
	api_level: string;
	device: string;
	input_type: number;
	options: string;
	requests: Array<{
		writing_guide: { writing_area_width: number; writing_area_height: number };
		pre_context: string;
		max_completions: number;
		language: string;
		ink: number[][][];
	}>;
}

type GoogleResponse = [string, Array<[string, string[], ...unknown[]]>?];

/**
 * Recognize handwritten kanji using Google's handwriting recognition API
 */
export async function recognizeKanji(
	strokes: Stroke[],
	width: number,
	height: number
): Promise<RecognitionResult> {
	if (strokes.length === 0) {
		return { success: false, predictions: [], error: 'No strokes provided' };
	}

	const body: GoogleRequest = {
		app_version: 0.4,
		api_level: '537.36',
		device: '5.0 (X11; Linux x86_64)',
		input_type: 0,
		options: 'enable_pre_space',
		requests: [
			{
				writing_guide: { writing_area_width: width, writing_area_height: height },
				pre_context: '',
				max_completions: 0,
				language: 'ja',
				ink: strokes
			}
		]
	};

	try {
		const response = await fetch(ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});

		if (!response.ok) {
			return {
				success: false,
				predictions: [],
				error: `HTTP ${response.status}: ${response.statusText}`
			};
		}

		const data = (await response.json()) as GoogleResponse;

		if (data[0] === 'SUCCESS' && data[1]?.[0]?.[1]) {
			return { success: true, predictions: data[1][0][1] };
		}

		return { success: false, predictions: [], error: 'Unexpected API response format' };
	} catch (error) {
		return {
			success: false,
			predictions: [],
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Check if a string contains only hiragana or katakana (no kanji)
 */
function isKanaOnly(str: string): boolean {
	// Hiragana: U+3040-U+309F, Katakana: U+30A0-U+30FF
	return /^[\u3040-\u309F\u30A0-\u30FF]+$/.test(str);
}

/**
 * Filter out hiragana/katakana predictions, keeping only kanji
 */
export function filterKanjiOnly(predictions: string[]): string[] {
	return predictions.filter((p) => !isKanaOnly(p));
}

/**
 * Check if target kanji is in the top N predictions (excluding kana)
 */
export function isCorrect(result: RecognitionResult, target: string, topN = 1): boolean {
	if (!result.success) return false;
	const kanjiPredictions = filterKanjiOnly(result.predictions);
	return kanjiPredictions.slice(0, topN).includes(target);
}
