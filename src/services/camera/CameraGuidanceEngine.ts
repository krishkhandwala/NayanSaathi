import { CameraGuidanceState, GuidancePromptType } from '../../types/guidance';
import { motionSensorService } from '../sensors/MotionSensorService';
import { imagePreprocessService, PreprocessAnalysis } from '../recognition/ImagePreprocessService';
import { audioFeedbackService } from '../text-to-speech/AudioFeedbackService';
import { t } from '../../localization/i18n';
import { TranslationKey } from '../../localization/i18n';

export class CameraGuidanceEngine {
  private state: CameraGuidanceState = {
    lighting: 'GOOD',
    blur: 'SHARP',
    motion: 'STEADY',
    framing: 'CENTERED',
    currentPrompt: null,
    lastPromptTime: 0,
    isTorchRecommended: false,
  };

  private readonly cooldownMs = 2500; // 2.5 seconds prompt cooldown
  private isGuidanceEnabled = true;

  public setEnabled(enabled: boolean): void {
    this.isGuidanceEnabled = enabled;
  }

  public evaluateFrame(
    analysis: PreprocessAnalysis,
    boundingBox?: { x: number; y: number; width: number; height: number },
    containerDimensions = { width: 400, height: 600 }
  ): CameraGuidanceState {
    const now = Date.now();
    const motion = motionSensorService.getCondition();

    this.state.lighting = analysis.lighting;
    this.state.blur = analysis.blurCondition;
    this.state.motion = motion;
    this.state.isTorchRecommended = analysis.lighting === 'TOO_DARK';

    let prompt: GuidancePromptType | null = null;
    let translationKey: TranslationKey | null = null;

    // 1. Highest priority: Motion shake
    if (motion === 'EXCESSIVE_MOTION') {
      prompt = 'HOLD_STEADY';
      translationKey = 'guidance_hold_steady';
    }
    // 2. Lighting condition
    else if (analysis.lighting === 'TOO_DARK') {
      prompt = 'TOO_DARK';
      translationKey = 'guidance_too_dark';
    }
    // 3. Excessive blur
    else if (analysis.blurCondition === 'EXCESSIVE_BLUR') {
      prompt = 'HOLD_STEADY';
      translationKey = 'guidance_hold_steady';
    }
    // 4. Bounding box framing assessment if note detected
    else if (boundingBox) {
      const boxArea = boundingBox.width * boundingBox.height;
      const totalArea = containerDimensions.width * containerDimensions.height;
      const areaRatio = boxArea / totalArea;

      if (areaRatio > 0.8) {
        prompt = 'MOVE_FARTHER';
        translationKey = 'guidance_move_farther';
      } else if (areaRatio < 0.15) {
        prompt = 'MOVE_CLOSER';
        translationKey = 'guidance_move_closer';
      } else {
        // Check centering
        const centerX = boundingBox.x + boundingBox.width / 2;
        const targetX = containerDimensions.width / 2;
        if (Math.abs(centerX - targetX) > containerDimensions.width * 0.3) {
          prompt = 'MOVE_CENTER';
          translationKey = 'guidance_move_center';
        }
      }
    }

    this.state.currentPrompt = prompt;

    // Issue audio announcement if cooldown elapsed and prompt changed or repeated after cooldown
    if (
      this.isGuidanceEnabled &&
      prompt &&
      translationKey &&
      now - this.state.lastPromptTime >= this.cooldownMs
    ) {
      this.state.lastPromptTime = now;
      audioFeedbackService.speak(t(translationKey), 'GUIDANCE');
    }

    return { ...this.state };
  }

  public getState(): CameraGuidanceState {
    return { ...this.state };
  }
}

export const cameraGuidanceEngine = new CameraGuidanceEngine();
