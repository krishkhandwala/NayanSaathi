import { Platform } from 'react-native';
import { VoiceCommand, VoiceIntentType } from '../../types/speech';
import { SupportedLanguage } from '../../types/settings';
import { SUPPORTED_LANGUAGES } from '../../constants/languages';

interface IntentRule {
  intent: VoiceIntentType;
  regexPatterns: RegExp[];
  hasNumericArg?: boolean;
}

const INTENT_RULES: IntentRule[] = [
  {
    intent: 'START_SCANNING',
    regexPatterns: [
      /\b(start(\s+(scanning|counting))?|scan(\s+notes?)?|camera|open\s+scanner|check\s+note)\b/i,
      /(स्कैन\s*(शुरू|चालू|करें)?|गिनना\s*शुरू|कैमरा|नोट\s*जांचें)/i,
      /(ஸ்கேன்\s*தொடங்கு|எண்ண\s*தொடங்கு|கேமரா)/i,
      /(स्कॅन\s*(सुरू|करा)|मोजणे\s*सुरू|कॅमेरा)/i,
      /(স্ক্যান\s*শুরু|গণনা\s*শুরু|ক্যামেরা)/i,
    ],
  },
  {
    intent: 'STOP_SCANNING',
    regexPatterns: [
      /\b(stop(\s+scanning)?|pause|halt|freeze)\b/i,
      /(रोकें|बंद\s*करें|रोको)/i,
      /(நிறுத்து|நில்)/i,
      /(थांबवा|बंद\s*करा)/i,
      /(থামুন|বন্ধ\s*করুন)/i,
    ],
  },
  {
    intent: 'QUERY_TOTAL',
    regexPatterns: [
      /\b(what\s+is\s+(my\s+)?total|total(\s+amount)?|how\s+much(\s+cash|\s+money)?|balance|check\s+balance|my\s+cash)\b/i,
      /(कुल\s*(कितना|बताओ|रुपये)|कितने\s*(पैसे|रुपये)|बैलेंस)/i,
      /(மொத்தம்\s*என்ன|மொத்த\s*தொகை|மீதி)/i,
      /(एकूण\s*(किती|रक्कम)|शिल्लक)/i,
      /(মোট\s*(কত|টাকা)|ব্যালেন্স)/i,
    ],
  },
  {
    intent: 'CLEAR_WALLET',
    regexPatterns: [
      /\b(clear(\s+wallet|\s+cash)?|empty\s+wallet|reset(\s+wallet|\s+cash)?)\b/i,
      /(वॉलेट\s*खाली\s*करें|साफ\s*करें|रीसेट)/i,
      /(பையை\s*அழி|காலியாக்கு)/i,
      /(पाकीट\s*रिकामे\s*करा)/i,
      /(ওয়ালেট\s*খালি\s*করুন)/i,
    ],
  },
  {
    intent: 'CONFIRM_CLEAR',
    regexPatterns: [
      /\b(confirm|yes|proceed|yes\s+clear)\b/i,
      /(हाँ|पुष्टि\s*करें|ठीक\s*है)/i,
      /(ஆம்|உறுதி\s*செய்)/i,
      /(होय|नक्की\s*करा)/i,
      /(হ্যাঁ|নিশ্চিত\s*করুন)/i,
    ],
  },
  {
    intent: 'UNDO_LAST',
    regexPatterns: [
      /\b(undo(\s+last)?|remove\s+last(\s+note)?|delete\s+last)\b/i,
      /(अंतिम\s*हटाओ|वापस\s*लो|पिछला\s*हटाओ)/i,
      /(கடைசியை\s*நீக்கு|மீட்டெடு)/i,
      /(शेवटचे\s*काढा|मागे\s*घ्या)/i,
      /(আগেরটা\s*বাতিল|শেষেরটা\s*মুছুন|আগেরটা\s*মুছুন)/i,
    ],
  },
  {
    intent: 'CANCEL',
    regexPatterns: [
      /\b(cancel|no|abort|back)\b/i,
      /(नहीं|रद्द\s*करें|वापस)/i,
      /(வேண்டாம்|ரத்து\s*செய்)/i,
      /(नाही|रद्द\s*करा)/i,
      /(না|বাতিল\s*করুন|^বাতিল$)/i,
    ],
  },
  {
    intent: 'SPLIT_CASH',
    hasNumericArg: true,
    regexPatterns: [
      /\b(divide\s+by|split\s+(among|between|by)|share\s+with)\s*(\d{1,2}|two|three|four|five|six|seven|eight|nine|ten|twenty)?\b/i,
      /(\d{1,2})\s*(लोगों\s*में\s*बांटो|व्यक्तियों\s*में\s*बांटो|में\s*विभाजित)/i,
      /(\d{1,2})\s*(பேருக்கு\s*பகிர்|நபர்)/i,
      /(\d{1,2})\s*(जणांमध्ये\s*वाटा|लोकांमध्ये)/i,
      /(\d{1,2})\s*(জনের\s*মধ্যে\s*ভাগ|ভাগ\s*করুন)/i,
    ],
  },
  {
    intent: 'CHANGE_LANGUAGE',
    regexPatterns: [
      /\b(change\s+language|switch\s+language)\b/i,
      /(भाषा\s*(बदलो|परिवर्तित\s*करें))/i,
      /(மொழி\s*மாற்று)/i,
      /(भाषा\s*बदला)/i,
      /(ভাষা\s*পরিবর্তন)/i,
    ],
  },
  {
    intent: 'REPEAT_LAST',
    regexPatterns: [
      /\b(repeat|say\s+again|what\s+did\s+you\s+say)\b/i,
      /(फिर\s*से\s*बोलो|दोहराएं)/i,
      /(மீண்டும்\s*சொல்|மறுபடி\s*கூறு)/i,
      /(पुन्हा\s*सांगा|परत\s*बोला)/i,
      /(আবার\s*বলুন|পুনরায়\s*বলুন)/i,
    ],
  },
  {
    intent: 'HELP',
    regexPatterns: [
      /\b(what\s+can\s+i\s+say|help(\s+me)?|command\s+list|instructions|what\s+to\s+say)\b/i,
      /(मैं\s*क्या\s*बोल\s*सकता\s*हूँ|सहायता|मदद)/i,
      /(உதவி|என்ன\s*சொல்லலாம்)/i,
      /(மீ\s*काय\s*बोलू\s*शकतो|मदत)/i,
      /(আমি\s*কি\s*বলতে\s*পারি|সাহায্য)/i,
    ],
  },
];

const WORD_NUMBERS: Record<string, number> = {
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  twenty: 20,
};

export class VoiceCommandService {
  private isListeningActive = false;
  private currentLanguage: SupportedLanguage = 'en';
  private webRecognition: any = null;

  public async initialize(): Promise<void> {
    this.isListeningActive = false;
  }

  public setLanguage(lang: SupportedLanguage): void {
    this.currentLanguage = lang;
    if (this.webRecognition) {
      const locales: Record<SupportedLanguage, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        ta: 'ta-IN',
        mr: 'mr-IN',
        bn: 'bn-IN',
      };
      this.webRecognition.lang = locales[lang] || 'en-IN';
    }
  }

  public isOfflineReady(): boolean {
    return SUPPORTED_LANGUAGES[this.currentLanguage]?.offlineSpeechRecognitionAvailable ?? false;
  }

  public getSupportedLanguages(): SupportedLanguage[] {
    return Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[];
  }

  public parseCommand(rawText: string): VoiceCommand {
    const startTimestamp = Date.now();
    const normalized = this.normalizeText(rawText);

    if (!normalized) {
      return {
        intent: 'UNKNOWN',
        rawText,
        normalizedText: '',
        confidence: 0,
        timestamp: startTimestamp,
      };
    }

    for (const rule of INTENT_RULES) {
      for (const pattern of rule.regexPatterns) {
        const match = normalized.match(pattern);
        if (match) {
          let numericArg: number | undefined;

          if (rule.hasNumericArg) {
            numericArg = this.extractNumber(normalized);
          }

          return {
            intent: rule.intent,
            rawText,
            normalizedText: normalized,
            numericArg,
            confidence: 0.95,
            timestamp: startTimestamp,
          };
        }
      }
    }

    return {
      intent: 'UNKNOWN',
      rawText,
      normalizedText: normalized,
      confidence: 0.2,
      timestamp: startTimestamp,
    };
  }

  public normalizeText(text: string): string {
    return text
      .trim()
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '')
      .replace(/\s+/g, ' ');
  }

  private extractNumber(text: string): number | undefined {
    const digitMatch = text.match(/\b([2-9]|1[0-9]|20)\b/);
    if (digitMatch) {
      return parseInt(digitMatch[1], 10);
    }

    for (const [word, val] of Object.entries(WORD_NUMBERS)) {
      if (text.includes(word)) {
        return val;
      }
    }

    return undefined;
  }

  /**
   * Start listening for microphone input.
   * On Web browsers, uses Web Speech API (webkitSpeechRecognition / SpeechRecognition).
   */
  public startListening(
    onCommand: (cmd: VoiceCommand) => void,
    onError?: (errorText: string) => void
  ): boolean {
    this.isListeningActive = true;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          if (this.webRecognition) {
            try {
              this.webRecognition.abort();
            } catch {}
          }

          const recognition = new SpeechRecognition();
          const locales: Record<SupportedLanguage, string> = {
            en: 'en-IN',
            hi: 'hi-IN',
            ta: 'ta-IN',
            mr: 'mr-IN',
            bn: 'bn-IN',
          };
          recognition.lang = locales[this.currentLanguage] || 'en-IN';
          recognition.continuous = false;
          recognition.interimResults = false;

          recognition.onresult = (event: any) => {
            const transcript = event.results?.[0]?.[0]?.transcript || '';
            this.isListeningActive = false;
            const cmd = this.parseCommand(transcript);
            onCommand(cmd);
          };

          recognition.onerror = (err: any) => {
            this.isListeningActive = false;
            if (onError) {
              onError(err.error || 'Speech recognition error');
            }
          };

          recognition.onend = () => {
            this.isListeningActive = false;
          };

          this.webRecognition = recognition;
          recognition.start();
          return true;
        } catch (e: any) {
          console.warn('[VoiceCommand] Web SpeechRecognition start error:', e);
          this.isListeningActive = false;
          if (onError) onError(e?.message || 'Could not start microphone');
          return false;
        }
      }
    }

    return false;
  }

  public stopListening(): void {
    this.isListeningActive = false;
    if (this.webRecognition) {
      try {
        this.webRecognition.stop();
      } catch {}
      this.webRecognition = null;
    }
  }

  public isListening(): boolean {
    return this.isListeningActive;
  }

  public dispose(): void {
    this.stopListening();
  }
}

export const voiceCommandService = new VoiceCommandService();
