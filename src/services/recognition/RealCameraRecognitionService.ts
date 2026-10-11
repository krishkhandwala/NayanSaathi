/**
 * RealCameraRecognitionService
 *
 * Highly robust, multi-rule Indian currency recognition engine processing actual pixel buffers
 * captured from webcams (HTML5 Canvas) and mobile cameras (CameraView takePictureAsync).
 *
 * Features:
 *   - 5-Rule Multi-Metric Scoring Matrix for all 7 RBI denominations
 *   - RGB channel dominance ratios (eliminates hue-only ambiguities)
 *   - Contrast & background noise filtration
 *   - Saturation-lightness boundary enforcement (disambiguates ₹10 vs ₹200, ₹500 vs ₹20, ₹50 vs ₹100)
 *   - Margin-of-victory confidence scoring
 */

import { DenominationValue, SingleNoteResult, MultiNoteResult } from '../../types/currency';
import { confidenceStabilityFilter } from './ConfidenceStabilityFilter';
import { multipleNoteDetector } from './MultipleNoteDetector';
import { toByteArray } from 'base64-js';
import jpeg from 'jpeg-js';

export interface DenomRuleSpec {
  denom: DenominationValue;
  name: string;
  // Rule 1: Hue boundary
  minH: number;
  maxH: number;
  // Rule 2: Saturation envelope
  minS: number;
  maxS: number;
  // Rule 3: Lightness envelope
  minL: number;
  maxL: number;
  // Rule 4: Reference RGB centroid
  refR: number;
  refG: number;
  refB: number;
  // Rule 5: Channel balance validator
  validateChannels: (r: number, g: number, b: number) => boolean;
}

export const DENOM_SPECS: DenomRuleSpec[] = [
  // ₹10: Chocolate Brown (terracotta/warm brown)
  // Channels: R >> G > B, Red significantly dominates Blue, lower lightness than ₹200
  {
    denom: 10,
    name: '₹10 (Chocolate Brown)',
    minH: 10,
    maxH: 36,
    minS: 0.14,
    maxS: 0.75,
    minL: 0.12,
    maxL: 0.52,
    refR: 160,
    refG: 105,
    refB: 60,
    validateChannels: (r, g, b) => r > g && r > b * 1.4 && (r - b) > 35,
  },

  // ₹200: Bright Orange-Yellow
  // Channels: High R, High G, Low B, High Saturation, High Lightness
  {
    denom: 200,
    name: '₹200 (Bright Yellow)',
    minH: 34,
    maxH: 52,
    minS: 0.35,
    maxS: 1.0,
    minL: 0.35,
    maxL: 0.88,
    refR: 245,
    refG: 185,
    refB: 35,
    validateChannels: (r, g, b) => r > 140 && g > 110 && r > b * 1.6 && r >= g,
  },

  // ₹20: Greenish-Yellow
  // Channels: Green is prominent, G >= R * 0.85, G > B * 1.35
  {
    denom: 20,
    name: '₹20 (Greenish Yellow)',
    minH: 54,
    maxH: 85,
    minS: 0.18,
    maxS: 0.90,
    minL: 0.20,
    maxL: 0.78,
    refR: 175,
    refG: 188,
    refB: 70,
    validateChannels: (r, g, b) => g >= r * 0.80 && g > b * 1.3 && g > 90,
  },

  // ₹500: Stone Grey (sage green tint, very low saturation)
  // Channels: R, G, B are tightly balanced (neutral grey), saturation is lowest of all notes
  {
    denom: 500,
    name: '₹500 (Stone Grey)',
    minH: 55,
    maxH: 160,
    minS: 0.02,
    maxS: 0.22, // Critical: stone grey must have low saturation
    minL: 0.25,
    maxL: 0.78,
    refR: 135,
    refG: 145,
    refB: 132,
    validateChannels: (r, g, b) => Math.abs(r - g) < 40 && Math.abs(g - b) < 40 && Math.abs(r - b) < 45,
  },

  // ₹50: Fluorescent Blue / Cyan
  // Channels: Blue and Green dominate Red (B > R * 1.25, G > R)
  {
    denom: 50,
    name: '₹50 (Fluorescent Blue)',
    minH: 170,
    maxH: 220,
    minS: 0.15,
    maxS: 0.95,
    minL: 0.20,
    maxL: 0.82,
    refR: 65,
    refG: 180,
    refB: 215,
    validateChannels: (r, g, b) => b > r * 1.2 && g > r * 1.05 && b > 100,
  },

  // ₹100: Lavender / Violet-Purple
  // Channels: Blue highest, Red moderate, Green lowest (B > G * 1.15, R > G * 0.85)
  {
    denom: 100,
    name: '₹100 (Lavender)',
    minH: 222,
    maxH: 285,
    minS: 0.12,
    maxS: 0.88,
    minL: 0.20,
    maxL: 0.85,
    refR: 165,
    refG: 150,
    refB: 220,
    validateChannels: (r, g, b) => b > g * 1.1 && b >= r * 0.9 && b > 90,
  },

  // ₹2000: Magenta / Deep Rose Pink
  // Channels: Red and Blue both high, Green suppressed
  {
    denom: 2000,
    name: '₹2000 (Magenta)',
    minH: 300,
    maxH: 355,
    minS: 0.16,
    maxS: 0.95,
    minL: 0.20,
    maxL: 0.85,
    refR: 215,
    refG: 70,
    refB: 155,
    validateChannels: (r, g, b) => r > g * 1.35 && b > g * 1.15 && r > 110,
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
  marginScore?: number;
}

export function analyzePixelRegion(
  pixels: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
  startX = 0.10,
  endX = 0.90,
  startY = 0.10,
  endY = 0.90
): PixelAnalysisResult {
  const x0 = Math.floor(width * startX);
  const x1 = Math.floor(width * endX);
  const y0 = Math.floor(height * startY);
  const y1 = Math.floor(height * endY);

  const step = Math.max(2, Math.floor(Math.sqrt((width * height) / 5000)));

  let totalLuma = 0;
  let sampleCount = 0;

  // Aggregate multi-rule score for each denomination
  const scores = new Map<DenominationValue, number>();
  for (const spec of DENOM_SPECS) {
    scores.set(spec.denom, 0);
  }

  for (let y = y0; y < y1; y += step) {
    for (let x = x0; x < x1; x += step) {
      const idx = (y * width + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];

      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      totalLuma += luma;
      sampleCount++;

      // Skip extreme dark shadows or blown highlights in individual pixels
      if (luma < 20 || luma > 250) continue;

      const [h, s, l] = rgbToHsl(r, g, b);

      // Evaluate pixel against each candidate denomination
      for (const spec of DENOM_SPECS) {
        let pixelScore = 0;

        // 1. Hue window check
        const inHue =
          spec.minH <= spec.maxH
            ? h >= spec.minH && h <= spec.maxH
            : h >= spec.minH || h <= spec.maxH;

        if (inHue) pixelScore += 2.0;

        // 2. Saturation & Lightness envelope
        if (s >= spec.minS && s <= spec.maxS && l >= spec.minL && l <= spec.maxL) {
          pixelScore += 2.0;
        }

        // 3. Channel balance validator
        if (spec.validateChannels(r, g, b)) {
          pixelScore += 2.5;
        }

        // 4. Centroid Euclidean closeness
        const dr = (r - spec.refR) / 255;
        const dg = (g - spec.refG) / 255;
        const db = (b - spec.refB) / 255;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);
        if (dist < 0.35) {
          pixelScore += (0.35 - dist) * 4;
        }

        // Only add to score if at least 2 key criteria matched
        if (pixelScore >= 4.0) {
          scores.set(spec.denom, (scores.get(spec.denom) ?? 0) + pixelScore);
        }
      }
    }
  }

  if (sampleCount === 0) {
    return { luma: 128, isTooDark: false, isTooBright: false, detectedDenom: null, confidence: 0 };
  }

  const avgLuma = totalLuma / sampleCount;
  if (avgLuma < 22) {
    return { luma: avgLuma, isTooDark: true, isTooBright: false, detectedDenom: null, confidence: 0 };
  }
  if (avgLuma > 248) {
    return { luma: avgLuma, isTooDark: false, isTooBright: true, detectedDenom: null, confidence: 0 };
  }

  // Find top two scoring denominations to compute margin of victory
  let topDenom: DenominationValue | null = null;
  let topScore = 0;
  let secondScore = 0;

  scores.forEach((score, denom) => {
    if (score > topScore) {
      secondScore = topScore;
      topScore = score;
      topDenom = denom;
    } else if (score > secondScore) {
      secondScore = score;
    }
  });

  // Calculate ratio of points scored relative to theoretical max
  const maxPossibleScore = sampleCount * 8.0;
  const scoreRatio = topScore / maxPossibleScore;

  // Margin of victory over runner-up
  const margin = topScore > 0 ? (topScore - secondScore) / topScore : 0;

  // Threshold: must achieve at least 5% of max possible score
  if (!topDenom || topScore === 0 || scoreRatio < 0.05) {
    return {
      luma: avgLuma,
      isTooDark: false,
      isTooBright: false,
      detectedDenom: null,
      confidence: 0,
      marginScore: 0,
    };
  }

  // Calculate high confidence scaled by match density and margin
  const baseConfidence = 0.72 + Math.min(0.20, scoreRatio * 1.2);
  const marginBonus = Math.min(0.06, margin * 0.08);
  const confidence = Math.min(0.98, Math.max(0.70, baseConfidence + marginBonus));

  const spec = DENOM_SPECS.find((s) => s.denom === topDenom);

  return {
    luma: avgLuma,
    isTooDark: false,
    isTooBright: false,
    detectedDenom: topDenom,
    confidence,
    dominantColorName: spec?.name,
    marginScore: margin,
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
        modelVersion: 'multi-rule-color-v3',
        inferenceTimeMs: Date.now() - startTime,
      };
    }

    if (analysis.isTooBright) {
      return {
        denomination: null,
        confidence: 0,
        status: 'UNCERTAIN',
        timestamp: startTime,
        modelVersion: 'multi-rule-color-v3',
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
    const leftAnalysis = analyzePixelRegion(pixels, width, height, 0.05, 0.48, 0.12, 0.88);
    const rightAnalysis = analyzePixelRegion(pixels, width, height, 0.52, 0.95, 0.12, 0.88);

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
