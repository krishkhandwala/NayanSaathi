import * as Speech from 'expo-speech';
import { AnnouncementPriority, AudioAnnouncement } from '../../types/speech';
import { SupportedLanguage } from '../../types/settings';

const LANGUAGE_VOICE_MAP: Record<SupportedLanguage, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  mr: 'mr-IN',
  bn: 'bn-IN',
};

const PRIORITY_RANKS: Record<AnnouncementPriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  NORMAL: 2,
  GUIDANCE: 1,
};

export class AudioFeedbackService {
  private queue: AudioAnnouncement[] = [];
  private isSpeaking = false;
  private currentLanguage: SupportedLanguage = 'en';
  private speechRate = 1.0;
  private lastAnnouncementText = '';
  private lastAnnouncementTime = 0;
  private readonly duplicateCooldownMs = 2000; // 2 seconds cooldown as required by SRS

  public setLanguage(lang: SupportedLanguage): void {
    this.currentLanguage = lang;
  }

  public setSpeechRate(rate: number): void {
    // Normal bounds between 0.8 and 1.2
    this.speechRate = Math.max(0.7, Math.min(1.5, rate));
  }

  public async speak(
    text: string,
    priority: AnnouncementPriority = 'NORMAL',
    cancelPrevious = false
  ): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;

    const now = Date.now();

    // Check duplicate cooldown for non-critical announcements
    if (
      priority !== 'CRITICAL' &&
      trimmed === this.lastAnnouncementText &&
      now - this.lastAnnouncementTime < this.duplicateCooldownMs
    ) {
      return;
    }

    if (cancelPrevious || priority === 'CRITICAL') {
      await this.stop();
      this.queue = [];
    }

    const announcement: AudioAnnouncement = {
      id: `ann_${now}_${Math.random().toString(36).substring(2, 6)}`,
      text: trimmed,
      priority,
      timestamp: now,
      cancelPrevious,
    };

    // If queue has items, insert by priority rank
    this.insertByPriority(announcement);
    this.processQueue();
  }

  private insertByPriority(item: AudioAnnouncement): void {
    const itemRank = PRIORITY_RANKS[item.priority];
    const index = this.queue.findIndex(
      (queued) => PRIORITY_RANKS[queued.priority] < itemRank
    );

    if (index === -1) {
      this.queue.push(item);
    } else {
      this.queue.splice(index, 0, item);
    }
  }

  private async processQueue(): Promise<void> {
    if (this.isSpeaking || this.queue.length === 0) {
      return;
    }

    const next = this.queue.shift();
    if (!next) return;

    this.isSpeaking = true;
    this.lastAnnouncementText = next.text;
    this.lastAnnouncementTime = Date.now();

    const voiceLocale = LANGUAGE_VOICE_MAP[this.currentLanguage] || 'en-IN';

    try {
      Speech.speak(next.text, {
        language: voiceLocale,
        rate: this.speechRate,
        pitch: 1.0,
        onDone: () => {
          this.isSpeaking = false;
          this.processQueue();
        },
        onStopped: () => {
          this.isSpeaking = false;
        },
        onError: () => {
          this.isSpeaking = false;
          this.processQueue();
        },
      });
    } catch {
      this.isSpeaking = false;
      this.processQueue();
    }
  }

  public async stop(): Promise<void> {
    try {
      await Speech.stop();
    } catch {
      // Ignored
    } finally {
      this.isSpeaking = false;
      this.queue = [];
    }
  }
}

export const audioFeedbackService = new AudioFeedbackService();
