export type LightingCondition = 'GOOD' | 'TOO_DARK' | 'TOO_BRIGHT_GLARE';
export type BlurCondition = 'SHARP' | 'MODERATE_BLUR' | 'EXCESSIVE_BLUR';
export type MotionCondition = 'STEADY' | 'EXCESSIVE_MOTION';
export type FramingCondition = 'CENTERED' | 'OFF_CENTER' | 'TOO_CLOSE' | 'TOO_FAR' | 'NO_NOTE_DETECTED';

export type GuidancePromptType =
  | 'MOVE_CENTER'
  | 'MOVE_FARTHER'
  | 'MOVE_CLOSER'
  | 'HOLD_STEADY'
  | 'TOO_DARK'
  | 'TURN_ON_TORCH'
  | 'FLATTEN_NOTE'
  | 'SEPARATE_NOTES'
  | 'READY_TO_SCAN';

export interface CameraGuidanceState {
  lighting: LightingCondition;
  blur: BlurCondition;
  motion: MotionCondition;
  framing: FramingCondition;
  currentPrompt: GuidancePromptType | null;
  lastPromptTime: number;
  isTorchRecommended: boolean;
}
