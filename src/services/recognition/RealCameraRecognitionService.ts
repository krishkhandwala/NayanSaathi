/**
 * RealCameraRecognitionService
 *
 * Real-time Indian currency recognition engine processing actual pixel buffers
 * captured from webcams (browser HTML5 Canvas) and mobile cameras (CameraView takePictureAsync).
 *
 * Implements dual-metric recognition:
 *   1. Hue-Saturation-Lightness (HSL) histogram clustering with tolerant boundary rules
 *   2. Calibrated RBI reference color vector distance matching
 */

import { DenominationValue, SingleNoteResult, MultiNoteResult } from '../../types/currency';
import { confidenceStabilityFilter } from './ConfidenceStabilityFilter';
import { multipleNoteDetector } from './MultipleNoteDetector';
import { toByteArray } from 'base64-js';
import jpeg from 'jpeg-js';

export interface DenomProfile {
  denom: DenominationValue;
  name: string;
  minH: number;
  maxH: number;
  minS: number;
  maxS?: number;
  minL: number;
  maxL: number;
  // Normalized reference RGB vector for distance matching
  refR: number;
  refG: number;
  refB: number;
}

export const DENOM_PROFILES: DenomProfile[] = [
  // ₹10: Chocolate Brown
  {
    denom: 10,
    name: '₹10 (Chocolate Brown)',
    minH: 10,
    maxH: 45,
    minS: 0.12,
    maxS: 0.90,
    minL: 0.12,
    maxL: 0.65,
    refR: 165,
    refG: 110,
    refB: 65,
  },
  // ₹20: Greenish Yellow
  {
    denom: 20,
    name: '₹20 (Greenish Yellow)',
    minH: 45,
    maxH: 85,
    minS: 0.14,
    maxS: 0.90,
    minL: 0.18,
    maxL: 0.75,
    refR: 175,
    refG: 185,
    refB: 75,
  },
  // ₹50: Fluorescent Blue / Cyan
  {
    denom: 50,
    name: '₹50 (Fluorescent Blue)',
    minH: 165,
    maxH: 225,
    minS: 0.12,
    maxS: 0.95,
    minL: 0.18,
    maxL: 0.80,
    refR: 70,
    refG: 180,
    refB: 215,
  },
  // ₹100: Lavender / Violet-Purple
  {
    denom: 100,
    name: '₹100 (Lavender)',
    minH: 215,
    maxH: 285,
    minS: 0.12,
    maxS: 0.88,
    minL: 0.18,
    maxL: 0.82,
    refR: 165,
    refG: 155,
    refB: 215,
  },
  // ₹200: Bright Orange-Yellow
  {
    denom: 200,
    name: '₹200 (Bright Yellow)',
    minH: 32,
    maxH: 52,
    minS: 0.26,
    maxS: 1.0,
    minL: 0.28,
    maxL: 0.85,
    refR: 245,
    refG: 180,
    refB: 35,
  },
  // ₹500: Stone Grey (Sage green / grey, low saturation)
  {
    denom: 500,
    name: '₹500 (Stone Grey)',
    minH: 60,
    maxH: 155,
    minS: 0.03,
    maxS: 0.28,
    minL: 0.22,
    maxL: 0.78,
    refR: 135,
    refG: 145,
    refB: 130,
  },
  // ₹2000: Magenta / Deep Rose
  {
    denom: 2000,
    name: '₹2000 (Magenta)',
    minH: 295,
    maxH: 355,
    minS: 0.14,
    maxS: 0.95,
    minL: 0.18,
    maxL: 0.82,
    refR: 215,
    refG: 70,
    refB: 150,
  },
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
  startX = 0.12,
  endX = 0.88,
  startY = 0.12,
  endY = 0.88
): PixelAnalysisResult {
  const x0 = Math.floor(width * startX);
  const x1 = Math.floor(width * endX);
  const y0 = Math.floor(height * startY);
  const y1 = Math.floor(height * endY);

  const step = Math.max(2, Math.floor(Math.sqrt((width * height) / 4500)));

  let totalLuma = 0;
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
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
      totalR += r;
      totalG += g;
      totalB += b;
      sampleCount++;

      const [h, s, l] = rgbToHsl(r, g, b);

      for (const rule of DENOM_PROFILES) {
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
            break;
          }
        }
      }
    }
  }

  if (sampleCount === 0) {
    return { luma: 128, isTooDark: false, isTooBright: false, detectedDenom: null, confidence: 0 };
  }

  const avgLuma = totalLuma / sampleCount;
  if (avgLuma < 25) {
    return { luma: avgLuma, isTooDark: true, isTooBright: false, detectedDenom: null, confidence: 0 };
  }
  if (avgLuma > 248) {
    return { luma: avgLuma, isTooDark: false, isTooBright: true, detectedDenom: null, confidence: 0 };
  }

  // 1. Find top vote from HSL clustering
  let topDenom: DenominationValue | null = null;
  let maxVotes = 0;
  let topRuleName: string | undefined;

  denomVotes.forEach((votes, denom) => {
    if (votes > maxVotes) {
      maxVotes = votes;
      topDenom = denom;
      topRuleName = DENOM_PROFILES.find((r) => r.denom === denom)?.name;
    }
  });

  const voteRatio = maxVotes / sampleCount;

  // 2. Vector distance cross-check
  const meanR = totalR / sampleCount;
  const meanG = totalG / sampleCount;
  const meanB = totalB / sampleCount;

  let bestVectorDenom: DenominationValue | null = null;
  let bestVectorScore = 0;

  for (const prof of DENOM_PROFILES) {
    const dr = meanR - prof.refR;
    const dg = meanG - prof.refG;
    const db = meanB - prof.refB;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    // Max RGB distance ~ 441. Normalizing to similarity (0 to 1)
    const similarity = Math.max(0, 1 - dist / 220);
    if (similarity > bestVectorScore) {
      bestVectorScore = similarity;
      bestVectorDenom = prof.denom;
    }
  }

  // Combined decision: either dominant cluster >= 12% or high vector similarity >= 0.72
  let finalDenom: DenominationValue | null = null;
  let finalConfidence = 0;

  if (topDenom && voteRatio >= 0.12) {
    finalDenom = topDenom;
    finalConfidence = Math.min(0.98, Math.max(0.72, 0.65 + voteRatio * 0.75));
  } else if (bestVectorDenom && bestVectorScore >= 0.70) {
    finalDenom = bestVectorDenom;
    finalConfidence = Math.min(0.92, bestVectorScore);
    topRuleName = DENOM_PROFILES.find((r) => r.denom === bestVectorDenom)?.name;
  }

  if (!finalDenom) {
    return {
      luma: avgLuma,
      isTooDark: false,
      isTooBright: false,
      detectedDenom: null,
      confidence: Math.min(0.4, voteRatio * 2),
    };
  }

  return {
    luma: avgLuma,
    isTooDark: false,
    isTooBright: false,
    detectedDenom: finalDenom,
    confidence: finalConfidence,
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
    height: number,
    isManualCapture = false
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
      inferenceDuration,
      isManualCapture
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
    // Check left region
    const leftAnalysis = analyzePixelRegion(pixels, width, height, 0.05, 0.48, 0.15, 0.85);
    // Check right region
    const rightAnalysis = analyzePixelRegion(pixels, width, height, 0.52, 0.95, 0.15, 0.85);

    const detections: Array<{
      denomination: DenominationValue;
      confidence: number;
      box: { x: number; y: number; width: number; height: number };
    }> = [];

    if (leftAnalysis.detectedDenom && leftAnalysis.confidence >= 0.65) {
      detections.push({
        denomination: leftAnalysis.detectedDenom,
        confidence: leftAnalysis.confidence,
        box: { x: 20, y: 50, width: Math.floor(width * 0.42), height: Math.floor(height * 0.7) },
      });
    }

    if (rightAnalysis.detectedDenom && rightAnalysis.confidence >= 0.65) {
      detections.push({
        denomination: rightAnalysis.detectedDenom,
        confidence: rightAnalysis.confidence,
        box: { x: Math.floor(width * 0.52), y: 50, width: Math.floor(width * 0.42), height: Math.floor(height * 0.7) },
      });
    }

    // If both regions empty, try full center
    if (detections.length === 0) {
      const center = analyzePixelRegion(pixels, width, height);
      if (center.detectedDenom && center.confidence >= 0.65) {
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
