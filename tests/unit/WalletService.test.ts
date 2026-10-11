import { WalletService } from '../../src/services/wallet/WalletService';

describe('WalletService', () => {
  let wallet: WalletService;

  beforeEach(() => {
    wallet = new WalletService();
  });

  describe('Add Note and Integer Rupee Total Calculations', () => {
    it('initializes with 0 total and 0 confirmed notes', () => {
      expect(wallet.getCurrentTotal()).toBe(0);
      expect(wallet.getConfirmedNoteCount()).toBe(0);
      expect(wallet.getRecentEntries()).toEqual([]);
    });

    it('adds single confirmed notes correctly: ₹100 + ₹50 = ₹150', () => {
      wallet.addConfirmedNote(100);
      expect(wallet.getCurrentTotal()).toBe(100);
      expect(wallet.getConfirmedNoteCount()).toBe(1);

      wallet.addConfirmedNote(50);
      expect(wallet.getCurrentTotal()).toBe(150);
      expect(wallet.getConfirmedNoteCount()).toBe(2);
    });

    it('adds multiple notes correctly: ₹200 + ₹500 + ₹10 = ₹710', () => {
      wallet.addConfirmedNotes([
        { denomination: 200 },
        { denomination: 500 },
        { denomination: 10 },
      ]);

      expect(wallet.getCurrentTotal()).toBe(710);
      expect(wallet.getConfirmedNoteCount()).toBe(3);
    });

    it('rejects invalid denominations', () => {
      expect(() => {
        // @ts-expect-error test invalid denomination input
        wallet.addConfirmedNote(25);
      }).toThrow('Invalid denomination');
    });

    it('assigns unique entry IDs to each transaction', () => {
      const entry1 = wallet.addConfirmedNote(100);
      const entry2 = wallet.addConfirmedNote(100);
      expect(entry1.entryId).not.toEqual(entry2.entryId);
    });
  });

  describe('Undo Behavior', () => {
    it('undoes the most recent note addition only', () => {
      wallet.addConfirmedNote(500);
      wallet.addConfirmedNote(100);
      wallet.addConfirmedNote(50);
      expect(wallet.getCurrentTotal()).toBe(650);

      const undone = wallet.undoLastAddition();
      expect(undone?.totalValue).toBe(50);
      expect(wallet.getCurrentTotal()).toBe(600);
      expect(wallet.getConfirmedNoteCount()).toBe(2);
    });

    it('returns null and does not fail when undoing an empty wallet', () => {
      const undone = wallet.undoLastAddition();
      expect(undone).toBeNull();
      expect(wallet.getCurrentTotal()).toBe(0);
    });
  });

  describe('Clear Wallet Behavior', () => {
    it('resets running total and notes count to zero', () => {
      wallet.addConfirmedNote(500);
      wallet.addConfirmedNote(2000);
      expect(wallet.getCurrentTotal()).toBe(2500);

      const res = wallet.clearWallet();
      expect(res.clearedTotal).toBe(2500);
      expect(res.clearedCount).toBe(2);
      expect(wallet.getCurrentTotal()).toBe(0);
      expect(wallet.getConfirmedNoteCount()).toBe(0);
      expect(wallet.getRecentEntries()).toEqual([]);
    });
  });

  describe('Cash Split Calculations with Integer Arithmetic', () => {
    it('calculates equal shares and remainder for ₹1000 divided among 3 people', () => {
      wallet.addConfirmedNote(500);
      wallet.addConfirmedNote(500);
      expect(wallet.getCurrentTotal()).toBe(1000);

      const split = wallet.splitCurrentTotal(3);
      expect(split.numberOfPeople).toBe(3);
      expect(split.totalAmount).toBe(1000);
      expect(split.shareAmount).toBe(333); // floor(1000 / 3)
      expect(split.remainder).toBe(1);     // 1000 % 3
      expect(split.shareAmount * 3 + split.remainder).toBe(1000);
    });

    it('handles exact division with zero remainder: ₹500 among 4 people', () => {
      wallet.addConfirmedNote(500);
      const split = wallet.splitCurrentTotal(4);
      expect(split.shareAmount).toBe(125);
      expect(split.remainder).toBe(0);
    });

    it('rejects division when wallet total is zero', () => {
      expect(() => {
        wallet.splitCurrentTotal(3);
      }).toThrow('Cannot split cash when the wallet total is zero');
    });

    it('rejects invalid people count (< 2 or > 20)', () => {
      wallet.addConfirmedNote(100);
      expect(() => wallet.splitCurrentTotal(1)).toThrow();
      expect(() => wallet.splitCurrentTotal(25)).toThrow();
    });
  });
});
