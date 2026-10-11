import { DenominationValue } from './currency';

export interface WalletEntry {
  entryId: string;
  denomination: DenominationValue;
  quantity: number;
  totalValue: number; // Integer rupees
  timestamp: number;
  sourceDetectionIds: string[];
}

export interface WalletSession {
  sessionId: string;
  startedAt: number;
  runningTotal: number; // Integer rupees
  confirmedNoteCount: number;
  entries: WalletEntry[];
}

export interface SplitRequest {
  splitId: string;
  sessionId: string;
  numberOfPeople: number;
  totalAmount: number;
  shareAmount: number; // floor(total / numberOfPeople)
  remainder: number;   // total % numberOfPeople
  timestamp: number;
}

export interface SplitResult {
  numberOfPeople: number;
  totalAmount: number;
  shareAmount: number;
  remainder: number;
  formattedAnnouncement: string;
}
