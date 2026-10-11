import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../state/AppContext';
import { voiceCommandService } from '../services/speech/VoiceCommandService';
import { VoiceCommand } from '../types/speech';
import { hapticsService } from '../services/haptics/HapticsService';
import { walletService } from '../services/wallet/WalletService';

interface VoiceAssistantModalProps {
  visible: boolean;
  onClose: () => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme, walletTotal, clearWallet, undoLastWalletAddition, announce } = useApp();
  const router = useRouter();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (visible) {
      setTranscript('');
      setFeedback('Tap microphone or select a command below.');
      startListeningSession();
    } else {
      voiceCommandService.stopListening();
      setIsListening(false);
    }
    return () => {
      voiceCommandService.stopListening();
    };
  }, [visible]);

  const startListeningSession = () => {
    setFeedback('Listening... Please speak your command.');
    announce('Listening for voice command. Speak now.', 'HIGH');

    const started = voiceCommandService.startListening(
      (cmd: VoiceCommand) => {
        setIsListening(false);
        handleExecuteCommand(cmd);
      },
      (errorText: string) => {
        setIsListening(false);
        setFeedback(`Microphone not active: ${errorText}. You can tap any quick command below.`);
        announce('Could not capture audio. Please tap a command on screen.', 'NORMAL');
      }
    );

    setIsListening(started);
    if (!started && Platform.OS !== 'web') {
      setFeedback('Voice listening ready. Speak or tap a command below.');
    }
  };

  const handleExecuteCommand = (cmd: VoiceCommand) => {
    setTranscript(cmd.rawText || cmd.intent);
    hapticsService.trigger('CONFIRMED');

    switch (cmd.intent) {
      case 'QUERY_TOTAL': {
        const total = walletService.getCurrentTotal();
        const count = walletService.getConfirmedNoteCount();
        const msg = `Your total cash balance is ₹${total}. You have ${count} notes recorded.`;
        setFeedback(msg);
        announce(msg, 'HIGH', true);
        break;
      }

      case 'START_SCANNING': {
        const msg = 'Opening currency scanner. Place your note in front of the camera.';
        setFeedback(msg);
        announce(msg, 'HIGH', true);
        setTimeout(() => {
          onClose();
          router.push('/scanner');
        }, 600);
        break;
      }

      case 'STOP_SCANNING': {
        const msg = 'Scanning paused.';
        setFeedback(msg);
        announce(msg, 'HIGH', true);
        break;
      }

      case 'CLEAR_WALLET': {
        clearWallet();
        const msg = 'Wallet has been cleared. Balance is now zero rupees.';
        setFeedback(msg);
        announce(msg, 'HIGH', true);
        break;
      }

      case 'UNDO_LAST': {
        const undone = undoLastWalletAddition();
        if (undone) {
          const msg = `Removed ₹${undone.totalValue}. Current total is now ₹${walletService.getCurrentTotal()}.`;
          setFeedback(msg);
          announce(msg, 'HIGH', true);
        } else {
          const msg = 'Wallet is already empty. Nothing to undo.';
          setFeedback(msg);
          announce(msg, 'NORMAL', true);
        }
        break;
      }

      case 'SPLIT_CASH': {
        const people = cmd.numericArg || 2;
        try {
          const res = walletService.splitCurrentTotal(people);
          const msg = `Split between ${people} people: ₹${res.shareAmount} per person with ₹${res.remainder} remainder.`;
          setFeedback(msg);
          announce(msg, 'HIGH', true);
          setTimeout(() => {
            onClose();
            router.push('/split-cash');
          }, 800);
        } catch {
          const msg = 'Cannot split an empty wallet. Add notes first.';
          setFeedback(msg);
          announce(msg, 'HIGH', true);
        }
        break;
      }

      case 'HELP': {
        const msg =
          'You can say: What is my total, Start scanning, Clear wallet, Undo last, or Split between people.';
        setFeedback(msg);
        announce(msg, 'HIGH', true);
        break;
      }

      default: {
        const msg = `Command not recognized: "${cmd.rawText}". Please try saying: What is my total, or Scan notes.`;
        setFeedback(msg);
        announce(msg, 'HIGH', true);
        break;
      }
    }
  };

  const handleSimulateCommand = (rawText: string) => {
    const cmd = voiceCommandService.parseCommand(rawText);
    handleExecuteCommand(cmd);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>🎙️ Voice Assistant</Text>
            <TouchableOpacity
              onPress={onClose}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Close voice assistant"
              style={styles.closeBtn}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Microphone Status Button */}
          <View style={styles.micContainer}>
            <TouchableOpacity
              onPress={startListeningSession}
              accessible
              accessibilityRole="button"
              accessibilityLabel={isListening ? 'Listening. Tap to restart' : 'Tap to start speaking'}
              style={[
                styles.micCircle,
                { backgroundColor: isListening ? '#dc2626' : '#2563eb' },
              ]}
            >
              <Text style={styles.micEmoji}>{isListening ? '🛑' : '🎙️'}</Text>
            </TouchableOpacity>
            <Text style={[styles.statusText, { color: theme.textSecondary }]}>
              {isListening ? '● Listening to your voice...' : 'Tap mic to speak aloud'}
            </Text>
          </View>

          {/* Transcript & Spoken Feedback */}
          {transcript !== '' && (
            <View style={styles.transcriptBox}>
              <Text style={styles.transcriptLabel}>You said:</Text>
              <Text style={styles.transcriptText}>"{transcript}"</Text>
            </View>
          )}

          <View style={styles.feedbackBox}>
            <Text style={styles.feedbackLabel}>Speaker response:</Text>
            <Text style={styles.feedbackText}>{feedback}</Text>
          </View>

          {/* Quick Voice Command Chips */}
          <Text style={[styles.sectionHeading, { color: theme.text }]}>
            Quick Voice Commands (Spoken Aloud):
          </Text>

          <ScrollView style={styles.commandsScroll}>
            <TouchableOpacity
              style={[styles.cmdChip, { borderColor: theme.border }]}
              onPress={() => handleSimulateCommand('What is my total amount')}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Ask: What is my total amount"
            >
              <Text style={[styles.cmdText, { color: theme.text }]}>
                💰 "What is my total amount?"
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cmdChip, { borderColor: theme.border }]}
              onPress={() => handleSimulateCommand('Start scanning notes')}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Command: Start scanning notes"
            >
              <Text style={[styles.cmdText, { color: theme.text }]}>
                📸 "Start scanning notes"
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cmdChip, { borderColor: theme.border }]}
              onPress={() => handleSimulateCommand('Undo last note')}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Command: Undo last note"
            >
              <Text style={[styles.cmdText, { color: theme.text }]}>
                ↩️ "Undo last note"
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cmdChip, { borderColor: theme.border }]}
              onPress={() => handleSimulateCommand('Split cash among 3 people')}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Command: Split cash among 3 people"
            >
              <Text style={[styles.cmdText, { color: theme.text }]}>
                👥 "Split cash among 3 people"
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cmdChip, { borderColor: theme.border }]}
              onPress={() => handleSimulateCommand('Help, what can I say')}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Command: Help, what can I say"
            >
              <Text style={[styles.cmdText, { color: theme.text }]}>
                ❓ "Help, what can I say?"
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cmdChip, { borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
              onPress={() => handleSimulateCommand('Clear wallet')}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Command: Clear wallet"
            >
              <Text style={[styles.cmdText, { color: '#ef4444' }]}>
                🗑️ "Clear wallet"
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 2,
    borderColor: '#38bdf8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#334155',
  },
  closeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  micContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  micCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#38bdf8',
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  micEmoji: {
    fontSize: 34,
  },
  statusText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  transcriptBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#38bdf8',
  },
  transcriptLabel: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  transcriptText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  feedbackBox: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  feedbackLabel: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '700',
  },
  feedbackText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
    lineHeight: 22,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  commandsScroll: {
    maxHeight: 180,
  },
  cmdChip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
  },
  cmdText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
