/**
 * A single stroke: [x coordinates, y coordinates, timestamps]
 * Each array has the same length - one element per point in the stroke
 */
export type Stroke = [number[], number[], number[]];

/**
 * Result from handwriting recognition
 */
export interface RecognitionResult {
	success: boolean;
	/** Ordered list of predicted characters (most likely first) */
	predictions: string[];
	/** Error message if recognition failed */
	error?: string;
}
