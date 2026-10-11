import { DenominationValue, VALID_DENOMINATIONS } from '../../types/currency';
import { WalletEntry, WalletSession, SplitResult } from '../../types/wallet';

export class WalletService {
  private session: WalletSession;
  private undoStack: WalletEntry[] = [];

  constructor() {
    this.session = this.createNewSession();
  }

  private createNewSession(): WalletSession {
    return {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      startedAt: Date.now(),
      runningTotal: 0,
      confirmedNoteCount: 0,
      entries: [],
    };
  }

  public getSession(): WalletSession {
    return {
      ...this.session,
      entries: [...this.session.entries],
    };
  }

  public getCurrentTotal(): number {
    return this.session.runningTotal;
  }

  public getConfirmedNoteCount(): number {
    return this.session.confirmedNoteCount;
  }

  public getRecentEntries(): WalletEntry[] {
    return [...this.session.entries].reverse();
  }

  public addConfirmedNote(
    denomination: DenominationValue,
    sourceDetectionIds: string[] = []
  ): WalletEntry {
    if (!VALID_DENOMINATIONS.includes(denomination)) {
      throw new Error(`Invalid denomination: ${denomination}. Must be one of ${VALID_DENOMINATIONS.join(', ')}`);
    }

    const entry: WalletEntry = {
      entryId: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      denomination,
      quantity: 1,
      totalValue: Math.floor(denomination),
      timestamp: Date.now(),
      sourceDetectionIds,
    };

    this.session.entries.push(entry);
    this.session.runningTotal = Math.floor(this.session.runningTotal + entry.totalValue);
    this.session.confirmedNoteCount += 1;
    this.undoStack.push(entry);

    return entry;
  }

  public addConfirmedNotes(
    notes: { denomination: DenominationValue; sourceDetectionId?: string }[]
  ): WalletEntry {
    if (!notes || notes.length === 0) {
      throw new Error('Cannot add empty note set to wallet');
    }

    let batchValue = 0;
    const sourceIds: string[] = [];
    const firstDenom = notes[0].denomination;

    notes.forEach((note) => {
      if (!VALID_DENOMINATIONS.includes(note.denomination)) {
        throw new Error(`Invalid denomination: ${note.denomination}`);
      }
      batchValue += Math.floor(note.denomination);
      if (note.sourceDetectionId) {
        sourceIds.push(note.sourceDetectionId);
      }
    });

    const entry: WalletEntry = {
      entryId: `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      denomination: firstDenom,
      quantity: notes.length,
      totalValue: Math.floor(batchValue),
      timestamp: Date.now(),
      sourceDetectionIds: sourceIds,
    };

    this.session.entries.push(entry);
    this.session.runningTotal = Math.floor(this.session.runningTotal + batchValue);
    this.session.confirmedNoteCount += notes.length;
    this.undoStack.push(entry);

    return entry;
  }

  public undoLastAddition(): WalletEntry | null {
    if (this.session.entries.length === 0) {
      return null;
    }

    const lastEntry = this.session.entries.pop();
    if (!lastEntry) {
      return null;
    }

    this.session.runningTotal = Math.max(0, Math.floor(this.session.runningTotal - lastEntry.totalValue));
    this.session.confirmedNoteCount = Math.max(0, this.session.confirmedNoteCount - lastEntry.quantity);

    // Also pop from undoStack
    this.undoStack.pop();

    return lastEntry;
  }

  public clearWallet(): { clearedTotal: number; clearedCount: number } {
    const clearedTotal = this.session.runningTotal;
    const clearedCount = this.session.confirmedNoteCount;

    this.session = this.createNewSession();
    this.undoStack = [];

    return {
      clearedTotal,
      clearedCount,
    };
  }

  public splitCurrentTotal(numberOfPeople: number): SplitResult {
    const people = Math.floor(numberOfPeople);

    if (people < 2 || people > 20) {
      throw new Error('Number of people to split cash among must be between 2 and 20.');
    }

    const total = this.session.runningTotal;
    if (total <= 0) {
      throw new Error('Cannot split cash when the wallet total is zero.');
    }

    // Pure integer arithmetic as specified in SRS
    const shareAmount = Math.floor(total / people);
    const remainder = total % people;

    return {
      numberOfPeople: people,
      totalAmount: total,
      shareAmount,
      remainder,
      formattedAnnouncement: `The total is ₹${total}. Each person receives ₹${shareAmount}. The remaining amount is ₹${remainder}.`,
    };
  }
}

export const walletService = new WalletService();
