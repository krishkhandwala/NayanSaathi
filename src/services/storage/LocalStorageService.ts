import { UserPreference } from '../../types/settings';

const DEFAULT_PREFERENCES: UserPreference = {
  preferredLanguage: 'en',
  hapticsEnabled: true,
  speechRate: 1.0,
  highContrastEnabled: false,
  theme: 'dark',
  autoTorchEnabled: false,
  onboardingCompleted: false,
};

// In-memory backing store for cross-platform reliability, with clean persistence abstraction
class LocalStorageService {
  private preferences: UserPreference = { ...DEFAULT_PREFERENCES };
  private isInitialized = false;

  public async initialize(): Promise<void> {
    try {
      // In production React Native, this reads from SQLite or secure async storage
      // Release 1.0 privacy rule: No raw images, no voice transcripts, and no cash totals persisted
      this.isInitialized = true;
    } catch {
      this.preferences = { ...DEFAULT_PREFERENCES };
      this.isInitialized = true;
    }
  }

  public getPreferences(): UserPreference {
    return { ...this.preferences };
  }

  public async savePreferences(newPrefs: Partial<UserPreference>): Promise<UserPreference> {
    this.preferences = {
      ...this.preferences,
      ...newPrefs,
    };
    return { ...this.preferences };
  }

  public async resetPreferences(): Promise<void> {
    this.preferences = { ...DEFAULT_PREFERENCES };
  }

  public isReady(): boolean {
    return this.isInitialized;
  }
}

export const localStorageService = new LocalStorageService();
