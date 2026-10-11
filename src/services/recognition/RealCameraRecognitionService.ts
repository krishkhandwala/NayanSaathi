/**
 * RealCameraRecognitionService
 *
 * Real-time Indian currency recognition engine processing actual pixel buffers
 * captured from webcams (browser HTML5 Canvas) and mobile cameras (CameraView takePictureAsync).
 */

import { DenominationValue, SingleNoteResult, MultiNoteResult } from '../../types/currency';
import { confidenceStabilityFilter } from './ConfidenceStabilityFilter';
import { multipleNoteDetector } from './MultipleNoteDetector';
import { toByteArray } from 'base64-js';
import jpeg from 'jpeg-js';

// RBI Mahatma Gandhi New Series colour signatures (HSL)
interface DenomHueRule {
  minH: number;
  maxH: number;
  minS: number;
  maxS?: number;
  minL: number;
  maxL: number;
  denom: DenominationValue;
  name: string;
}

const DENOM_RULES: DenomHueRule[] = [
  // ₹10: Chocolate Brown
  { minH: 15, maxH: 38, minS: 0.16, maxS: 0.85, minL: 0.15, maxL: 0.58, denom: 10, name: '₹10 (Chocolate Brown)' },
  // ₹20: Greenish Yellow
  { minH: 50, maxH: 75, minS: 0.18, maxS: 0.85, minL: 0.25, maxL: 0.70, denom: 20, name: '₹20 (Greenish Yellow)' },
  // ₹50: Fluorescent Blue / Cyan
  { minH: 175, maxH: 218, minS: 0.16, maxS: 0.90, minL: 0.22, maxL: 0.75, denom: 50, name: '₹50 (Fluorescent Blue)' },
  // ₹100: Lavender / Violet-Purple
  { minH: 222, maxH: 275, minS: 0.14, maxS: 0.80, minL: 0.24, maxL: 0.75, denom: 100, name: '₹100 (Lavender)' },
  // ₹200: Bright Orange-Yellow (vivid saturation)
  { minH: 38, maxH: 49, minS: 0.35, maxS: 0.98, minL: 0.32, maxL: 0.78, denom: 200, name: '₹200 (Bright Yellow)' },
  // ₹500: Stone Grey (Sage green / grey, notably low saturation)
  { minH: 68, maxH: 135, minS: 0.04, maxS: 0.24, minL: 0.28, maxL: 0.70, denom: 500, name: '₹500 (Stone Grey)' },
  // ₹2000: Magenta / Deep Rose
  { minH: 305, maxH: 350, minS: 0.18, maxS: 0.90, minL: 0.25, maxL: 0.75, denom: 2000, name: '₹2000 (Magenta)' },
];

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;

  if (max === min) {
    return [0, 0, l];
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;

  if (max === rn) {
    h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  } else if (max === gn) {
    h = ((bn - rn) / d + 2) / 6;
  } else {
    h = ((rn - gn) / d + 4) / 6;
  }

  return [h * 360, s, l];
}

export interface PixelAnalysisResult {
  luma: number;
  isTooDark: boolean;
  isTooBright: boolean;
  detectedDenom: DenominationValue | null;
  confidence: number;
  dominantColorName?: string;
}

export function analyzePixelRegion(
  pixels: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  startX = 0.15,
  endX = 0.85,
  startY = 0.15,
  endY = 0.85
): PixelAnalysisResult {
  const x0 = Math.floor(width * startX);
  const x1 = Math.floor(width * endX);
  const y0 = Math.floor(height * startY);
  const y1 = Math.floor(height * endY);

  const step = Math.max(2, Math.floor(Math.sqrt((width * height) / 4000)));

  let totalLuma = 0;
  let sampleCount = 0;
  const denomVotes = new Map<DenominationValue, number>();

  for (let y = y0; y < y1; y += step) {
    for (let x = x0; x < x1; x += step) {
      const idx = (y * width + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];

      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLuma += luma;
      sampleCount++;

      const [h, s, l] = rgbToHsl(r, g, b);

      for (const rule of DENOM_RULES) {
        if (
          s >= rule.minS &&
          (rule.maxS === undefined || s <= rule.maxS) &&
          l >= rule.minL &&
          l <= rule.maxL
        ) {
          const hueMatch =
            rule.minH <= rule.maxH
              ? h >= rule.minH && h <= rule.maxH
              : h >= rule.minH || h <= rule.maxH;

          if (hueMatch) {
            denomVotes.set(rule.denom, (denomVotes.get(rule.denom) ?? 0) + 1);
            break; // Matched first best rule
          }
        }
      }
    }
  }

  if (sampleCount === 0) {
    return { luma: 128, isTooDark: false, isTooBright: false, detectedDenom: null, confidence: 0 };
  }

  const avgLuma = totalLuma / sampleCount;
  if (avgLuma < 30) {
    return { luma: avgLuma, isTooDark: true, isTooBright: false, detectedDenom: null, confidence: 0 };
  }
  if (avgLuma > 245) {
    return { luma: avgLuma, isTooDark: false, isTooBright: true, detectedDenom: null, confidence: 0 };
  }

  // Find top matching denomination
  let topDenom: DenominationValue | null = null;
  let maxVotes = 0;
  let topRuleName: string | undefined;

  denomVotes.forEach((votes, denom) => {
    if (votes > maxVotes) {
      maxVotes = votes;
      topDenom = denom;
      topRuleName = DENOM_RULES.find((r) => r.denom === denom)?.name;
    }
  });

  const voteRatio = maxVotes / sampleCount;

  // Threshold: at least 14% of sampled note pixels must match the signature
  if (!topDenom || voteRatio < 0.14) {
    return {
      luma: avgLuma,
      isTooDark: false,
      isTooBright: false,
      detectedDenom: null,
      confidence: Math.min(0.4, voteRatio * 2),
    };
  }

  // Scale confidence between 0.72 and 0.98 based on density
  const confidence = Math.min(0.98, Math.max(0.72, 0.65 + voteRatio * 0.75));

  return {
    luma: avgLuma,
    isTooDark: false,
    isTooBright: false,
    detectedDenom: topDenom,
    confidence,
    dominantColorName: topRuleName,
  };
}

export class RealCameraRecognitionEngine {
  /**
   * Classify from raw pixel buffer (from Web Canvas or Mobile decoded JPEG)
   */
  public classifyPixels(
    pixels: Uint8ClampedArray | Uint8Array,
    width: number,
    height: number
  ): SingleNoteResult {
    const startTime = Date.now();
    const analysis = analyzePixelRegion(pixels, width, height);

    if (analysis.isTooDark) {
      return {
        denomination: null,
        confidence: 0,
        status: 'TOO_DARK',
        timestamp: startTime,
        modelVersion: 'real-camera-color-v2',
        inferenceTimeMs: Date.now() - startTime,
      };
    }

    if (analysis.isTooBright) {
      return {
        denomination: null,
        confidence: 0,
        status: 'UNCERTAIN',
        timestamp: startTime,
        modelVersion: 'real-camera-color-v2',
        inferenceTimeMs: Date.now() - startTime,
      };
    }

    const inferenceDuration = Date.now() - startTime;
    return confidenceStabilityFilter.processPrediction(
      analysis.detectedDenom,
      analysis.confidence,
      inferenceDuration
    );
  }

  /**
   * Detect multiple notes in a single frame by spatial region analysis
   */
  public detectMultipleNotesFromPixels(
    pixels: Uint8ClampedArray | Uint8Array,
    width: number,
    height: number
  ): MultiNoteResult {
    const startTime = Date.now();

    // Check left region
    const leftAnalysis = analyzePixelRegion(pixels, width, height, 0.05, 0.48, 0.15, 0.85);
    // Check right region
    const rightAnalysis = analyzePixelRegion(pixels, width, height, 0.52, 0.95, 0.15, 0.85);

    const detections: Array<{
      denomination: DenominationValue;
      confidence: number;
      box: { x: number; y: number; width: number; height: number };
    }> = [];

    if (leftAnalysis.detectedDenom && leftAnalysis.confidence >= 0.7) {
      detections.push({
        denomination: leftAnalysis.detectedDenom,
        confidence: leftAnalysis.confidence,
        box: { x: 20, y: 50, width: Math.floor(width * 0.42), height: Math.floor(height * 0.7) },
      });
    }

    if (rightAnalysis.detectedDenom && rightAnalysis.confidence >= 0.7) {
      detections.push({
        denomination: rightAnalysis.detectedDenom,
        confidence: rightAnalysis.confidence,
        box: { x: Math.floor(width * 0.52), y: 50, width: Math.floor(width * 0.42), height: Math.floor(height * 0.7) },
      });
    }

    // If both regions empty, try full center
    if (detections.length === 0) {
      const center = analyzePixelRegion(pixels, width, height);
      if (center.detectedDenom && center.confidence >= 0.7) {
        detections.push({
          denomination: center.detectedDenom,
          confidence: center.confidence,
          box: { x: Math.floor(width * 0.2), y: 60, width: Math.floor(width * 0.6), height: Math.floor(height * 0.6) },
        });
      }
    }

    return multipleNoteDetector.processDetections(detections);
  }

  /**
   * Decode base64 JPEG from mobile CameraView.takePictureAsync and classify
   */
  public decodeMobileBase64(base64Jpeg: string): { pixels: Uint8Array; width: number; height: number } | null {
    try {
      const cleanBase64 = base64Jpeg.replace(/^data:image\/[a-z]+;base64,/, '');
      const byteArray = toByteArray(cleanBase64);
      const decoded = jpeg.decode(byteArray, { useTArray: true, formatAsRGBA: true });
      return {
        pixels: decoded.data as Uint8Array,
        width: decoded.width,
        height: decoded.height,
      };
    } catch (e) {
      console.warn('Failed to decode mobile camera JPEG:', e);
      return null;
    }
  }

  public reset(): void {
    confidenceStabilityFilter.reset();
    multipleNoteDetector.resetTracking();
  }
}

export const realCameraRecognitionEngine = new RealCameraRecognitionEngine();
