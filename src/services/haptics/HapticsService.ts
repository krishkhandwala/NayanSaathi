import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticType =
  | 'SUCCESS'
  | 'FAILURE'
  | 'UNCERTAIN'
  | 'CONFIRMED'
  | 'COMMAND_RECOGNIZED'
  | 'SPLIT'
  | 'SELECTION';

export class HapticsService {
  private enabled = true;

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public async trigger(type: HapticType): Promise<void> {
    if (!this.enabled || Platform.OS === 'web') {
      return;
    }

    try {
      switch (type) {
        case 'SUCCESS':
          // Distinct double-tap style notification
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;

        case 'FAILURE':
          // Rigid / error notification
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;

        case 'UNCERTAIN':
          // Warning vibration
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;

        case 'CONFIRMED':
          // Heavy impact for adding money to wallet
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;

        case 'COMMAND_RECOGNIZED':
          // Medium impact for voice command acknowledgment
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;

        case 'SPLIT':
        case 'SELECTION':
          // Light selection tick
          await Haptics.selectionAsync();
          break;
      }
    } catch {
      // Haptics unavailable on simulator or device without motor - fail silently without throwing
    }
  }
}

export const hapticsService = new HapticsService();
