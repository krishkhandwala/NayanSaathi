export type VoiceIntentType =
  | 'START_SCANNING'
  | 'STOP_SCANNING'
  | 'QUERY_TOTAL'
  | 'CLEAR_WALLET'
  | 'CONFIRM_CLEAR'
  | 'CANCEL'
  | 'UNDO_LAST'
  | 'SPLIT_CASH'
  | 'CHANGE_LANGUAGE'
  | 'REPEAT_LAST'
  | 'HELP'
  | 'UNKNOWN';

export interface VoiceCommand {
  intent: VoiceIntentType;
  rawText: string;
  normalizedText: string;
  numericArg?: number;
  targetLanguage?: string;
  confidence: number;
  timestamp: number;
}

export type AnnouncementPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'GUIDANCE';

export interface AudioAnnouncement {
  id: string;
  text: string;
  priority: AnnouncementPriority;
  timestamp: number;
  cancelPrevious?: boolean;
}
