import { VoiceCommandService } from '../../src/services/speech/VoiceCommandService';

describe('VoiceCommandService - Deterministic Intent Parser', () => {
  let parser: VoiceCommandService;

  beforeEach(() => {
    parser = new VoiceCommandService();
  });

  describe('English Commands', () => {
    it('parses START_SCANNING intents', () => {
      expect(parser.parseCommand('start scanning').intent).toBe('START_SCANNING');
      expect(parser.parseCommand('start counting').intent).toBe('START_SCANNING');
      expect(parser.parseCommand('Scan notes please').intent).toBe('START_SCANNING');
    });

    it('parses STOP_SCANNING intents', () => {
      expect(parser.parseCommand('stop').intent).toBe('STOP_SCANNING');
      expect(parser.parseCommand('pause scanning').intent).toBe('STOP_SCANNING');
      expect(parser.parseCommand('halt').intent).toBe('STOP_SCANNING');
    });

    it('parses QUERY_TOTAL intents', () => {
      expect(parser.parseCommand('what is my total').intent).toBe('QUERY_TOTAL');
      expect(parser.parseCommand('Total amount').intent).toBe('QUERY_TOTAL');
      expect(parser.parseCommand('How much cash').intent).toBe('QUERY_TOTAL');
    });

    it('parses UNDO_LAST intents', () => {
      expect(parser.parseCommand('undo last').intent).toBe('UNDO_LAST');
      expect(parser.parseCommand('remove last').intent).toBe('UNDO_LAST');
    });

    it('parses CLEAR_WALLET and confirmation intents', () => {
      expect(parser.parseCommand('clear wallet').intent).toBe('CLEAR_WALLET');
      expect(parser.parseCommand('confirm').intent).toBe('CONFIRM_CLEAR');
      expect(parser.parseCommand('cancel').intent).toBe('CANCEL');
    });

    it('parses SPLIT_CASH intents and extracts numeric argument', () => {
      const cmd1 = parser.parseCommand('divide by 3');
      expect(cmd1.intent).toBe('SPLIT_CASH');
      expect(cmd1.numericArg).toBe(3);

      const cmd2 = parser.parseCommand('split among four');
      expect(cmd2.intent).toBe('SPLIT_CASH');
      expect(cmd2.numericArg).toBe(4);
    });

    it('parses HELP intents', () => {
      expect(parser.parseCommand('what can I say?').intent).toBe('HELP');
      expect(parser.parseCommand('help').intent).toBe('HELP');
    });
  });

  describe('Multilingual Indian Language Commands', () => {
    it('parses Hindi commands', () => {
      expect(parser.parseCommand('गिनना शुरू करें').intent).toBe('START_SCANNING');
      expect(parser.parseCommand('कुल कितना है').intent).toBe('QUERY_TOTAL');
      expect(parser.parseCommand('अंतिम हटाओ').intent).toBe('UNDO_LAST');
      expect(parser.parseCommand('वॉलेट खाली करें').intent).toBe('CLEAR_WALLET');
      expect(parser.parseCommand('हाँ पुष्टि करें').intent).toBe('CONFIRM_CLEAR');
    });

    it('parses Tamil commands', () => {
      expect(parser.parseCommand('ஸ்கேன் தொடங்கு').intent).toBe('START_SCANNING');
      expect(parser.parseCommand('மொத்தம் என்ன').intent).toBe('QUERY_TOTAL');
      expect(parser.parseCommand('நிறுத்து').intent).toBe('STOP_SCANNING');
    });

    it('parses Marathi commands', () => {
      expect(parser.parseCommand('मोजणे सुरू').intent).toBe('START_SCANNING');
      expect(parser.parseCommand('एकूण किती').intent).toBe('QUERY_TOTAL');
      expect(parser.parseCommand('पाकीट रिकामे करा').intent).toBe('CLEAR_WALLET');
    });

    it('parses Bengali commands', () => {
      expect(parser.parseCommand('স্ক্যান শুরু করুন').intent).toBe('START_SCANNING');
      expect(parser.parseCommand('মোট কত টাকা').intent).toBe('QUERY_TOTAL');
      expect(parser.parseCommand('আগেরটা বাতিল').intent).toBe('UNDO_LAST');
    });
  });

  describe('Unrecognized & Empty Inputs', () => {
    it('returns UNKNOWN for unsupported utterances', () => {
      expect(parser.parseCommand('open google maps').intent).toBe('UNKNOWN');
      expect(parser.parseCommand('order food').intent).toBe('UNKNOWN');
    });

    it('handles empty or punctuation-only strings safely', () => {
      expect(parser.parseCommand('').intent).toBe('UNKNOWN');
      expect(parser.parseCommand('   ... !!!   ').intent).toBe('UNKNOWN');
    });
  });
});
