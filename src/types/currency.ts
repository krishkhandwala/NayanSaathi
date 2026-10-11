export type DenominationValue = 10 | 20 | 50 | 100 | 200 | 500 | 2000;

export const VALID_DENOMINATIONS: readonly DenominationValue[] = [
  10, 20, 50, 100, 200, 500, 2000
] as const;

export type RecognitionStatus =
  | 'CONFIRMED'
  | 'UNCERTAIN'
  | 'LOW_CONFIDENCE'
  | 'BLURRED'
  | 'TOO_DARK'
  | 'OUT_OF_FRAME'
  | 'OVERLAPPING'
  | 'FAILED';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SingleNoteResult {
  denomination: DenominationValue | null;
  confidence: number;
  status: RecognitionStatus;
  timestamp: number;
  modelVersion: string;
  inferenceTimeMs: number;
  boundingBox?: BoundingBox;
}

export interface DetectedNote {
  noteId: string;
  denomination: DenominationValue;
  confidence: number;
  status: RecognitionStatus;
  timestamp: number;
  boundingBox: BoundingBox;
  trackingId?: number;
}

export interface MultiNoteResult {
  detectedNotes: DetectedNote[];
  totalValue: number;
  confirmedCount: number;
  uncertainCount: number;
  hasOverlappingNotes: boolean;
  timestamp: number;
  inferenceTimeMs: number;
}

export interface ModelMetadata {
  modelId: string;
  name: string;
  version: string;
  architecture: string;
  inputSize: [number, number, number]; // [width, height, channels]
  quantization: 'INT8' | 'FP16' | 'FP32';
  labels: string[];
  confidenceThreshold: number;
  minConsecutiveFrames: number;
  fileSizeBytes: number;
}
