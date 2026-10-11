import { BlurCondition, LightingCondition } from '../../types/guidance';

export interface PreprocessAnalysis {
  brightness: number; // 0 to 255
  lighting: LightingCondition;
  blurScore: number;  // higher is sharper
  blurCondition: BlurCondition;
  contrast: number;   // standard deviation
  hasGlare: boolean;
  isValidForInference: boolean;
}

export class ImagePreprocessService {
  // Calibrated thresholds
  private readonly darkThreshold = 45;      // Below 45 is too dark
  private readonly glareThreshold = 230;    // Above 230 average with high variance indicates glare
  private readonly blurThreshold = 100;     // Variance of Laplacian proxy threshold

  /**
   * Evaluates camera frame buffer / metadata for lighting and sharpness.
   * On mobile native devices, this is bridged to OpenCV Mobile native C++ module or Android CameraX ImageAnalysis.
   */
  public analyzeFrameData(
    lumaSamples: Uint8Array | number[],
    width: number,
    height: number
  ): PreprocessAnalysis {
    if (!lumaSamples || lumaSamples.length === 0) {
      return {
        brightness: 128,
        lighting: 'GOOD',
        blurScore: 150,
        blurCondition: 'SHARP',
        contrast: 50,
        hasGlare: false,
        isValidForInference: true,
      };
    }

    const n = lumaSamples.length;
    let sum = 0;
    let sumSq = 0;

    for (let i = 0; i < n; i++) {
      const val = lumaSamples[i];
      sum += val;
      sumSq += val * val;
    }

    const mean = sum / n;
    const variance = sumSq / n - mean * mean;
    const stdDev = Math.sqrt(Math.max(0, variance));

    // Lighting classification
    let lighting: LightingCondition = 'GOOD';
    let hasGlare = false;

    if (mean < this.darkThreshold) {
      lighting = 'TOO_DARK';
    } else if (mean > 210 && stdDev > 60) {
      lighting = 'TOO_BRIGHT_GLARE';
      hasGlare = true;
    }

    // Blur proxy (higher contrast variation in edges implies sharper image)
    const blurScore = stdDev * 2.5;
    let blurCondition: BlurCondition = 'SHARP';

    if (blurScore < 50) {
      blurCondition = 'EXCESSIVE_BLUR';
    } else if (blurScore < this.blurThreshold) {
      blurCondition = 'MODERATE_BLUR';
    }

    const isValidForInference =
      lighting !== 'TOO_DARK' && blurCondition !== 'EXCESSIVE_BLUR';

    return {
      brightness: Math.round(mean),
      lighting,
      blurScore: Math.round(blurScore),
      blurCondition,
      contrast: Math.round(stdDev),
      hasGlare,
      isValidForInference,
    };
  }
}

export const imagePreprocessService = new ImagePreprocessService();
