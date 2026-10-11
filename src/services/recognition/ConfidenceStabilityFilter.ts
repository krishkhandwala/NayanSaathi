import { DenominationValue, RecognitionStatus, SingleNoteResult } from '../../types/currency';

export interface StabilityFilterConfig {
  minConfidenceThreshold: number; // e.g. 0.85
  minConsecutiveFrames: number;   // e.g. 3 frames
  announcementCooldownMs: number; // e.g. 2000 ms
}

export const DEFAULT_FILTER_CONFIG: StabilityFilterConfig = {
  minConfidenceThreshold: 0.85,
  minConsecutiveFrames: 3,
  announcementCooldownMs: 2000,
};

export class ConfidenceStabilityFilter {
  private config: StabilityFilterConfig;
  private consecutiveCount = 0;
  private currentCandidate: DenominationValue | null = null;
  private lastConfirmedDenomination: DenominationValue | null = null;
  private lastConfirmedTimestamp = 0;

  constructor(config: Partial<StabilityFilterConfig> = {}) {
    this.config = { ...DEFAULT_FILTER_CONFIG, ...config };
  }

  public updateConfig(newConfig: Partial<StabilityFilterConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  public processPrediction(
    rawDenomination: DenominationValue | null,
    confidence: number,
    inferenceTimeMs: number
  ): SingleNoteResult {
    const now = Date.now();

    // 1. Check confidence threshold
    if (!rawDenomination || confidence < this.config.minConfidenceThreshold) {
      this.consecutiveCount = 0;
      this.currentCandidate = null;

      return {
        denomination: rawDenomination,
        confidence,
        status: confidence < 0.5 ? 'FAILED' : 'LOW_CONFIDENCE',
        timestamp: now,
        modelVersion: 'mobilenet-v3-quant-int8-v1',
        inferenceTimeMs,
      };
    }

    // 2. Check consecutive temporal stability
    if (this.currentCandidate === rawDenomination) {
      this.consecutiveCount += 1;
    } else {
      this.currentCandidate = rawDenomination;
      this.consecutiveCount = 1;
    }

    // 3. Evaluate if criteria met
    const isStable = this.consecutiveCount >= this.config.minConsecutiveFrames;

    if (!isStable) {
      return {
        denomination: rawDenomination,
        confidence,
        status: 'UNCERTAIN',
        timestamp: now,
        modelVersion: 'mobilenet-v3-quant-int8-v1',
        inferenceTimeMs,
      };
    }

    // 4. Stable prediction confirmed!
    this.lastConfirmedDenomination = rawDenomination;
    this.lastConfirmedTimestamp = now;

    return {
      denomination: rawDenomination,
      confidence,
      status: 'CONFIRMED',
      timestamp: now,
      modelVersion: 'mobilenet-v3-quant-int8-v1',
      inferenceTimeMs,
    };
  }

  public canAnnounce(denomination: DenominationValue): boolean {
    const now = Date.now();
    if (
      this.lastConfirmedDenomination === denomination &&
      now - this.lastConfirmedTimestamp < this.config.announcementCooldownMs
    ) {
      return false; // Still within cooldown for same denomination
    }
    return true;
  }

  public reset(): void {
    this.consecutiveCount = 0;
    this.currentCandidate = null;
    this.lastConfirmedDenomination = null;
    this.lastConfirmedTimestamp = 0;
  }
}

export const confidenceStabilityFilter = new ConfidenceStabilityFilter();
