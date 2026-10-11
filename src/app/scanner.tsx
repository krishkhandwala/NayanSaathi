import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useApp } from '../state/AppContext';
import { AccessibleButton } from '../components/AccessibleButton';
import { ScannerStatus } from '../components/ScannerStatus';
import { CameraGuidanceOverlay } from '../components/CameraGuidanceOverlay';
import { cameraGuidanceEngine } from '../services/camera/CameraGuidanceEngine';
import { currencyRecognitionService } from '../services/recognition/CurrencyRecognitionService';
import { imagePreprocessService } from '../services/recognition/ImagePreprocessService';
import { motionSensorService } from '../services/sensors/MotionSensorService';
import { hapticsService } from '../services/haptics/HapticsService';
import { t } from '../localization/i18n';
import { DenominationValue, SingleNoteResult, MultiNoteResult } from '../types/currency';
import { ACCESSIBILITY_METRICS } from '../constants/theme';

export default function ScannerScreen() {
  const { theme, addConfirmedNote, addConfirmedNotes, announce } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [isPaused, setIsPaused] = useState(false);
  const [torchActive, setTorchActive] = useState(false);
  const [isMultiMode, setIsMultiMode] = useState(false);
  const [latestSingleResult, setLatestSingleResult] = useState<SingleNoteResult | null>(null);
  const [latestMultiResult, setLatestMultiResult] = useState<MultiNoteResult | null>(null);
  const [guidanceState, setGuidanceState] = useState(cameraGuidanceEngine.getState());

  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start sensor listening for motion jitter detection
    motionSensorService.startListening();

    announce(t('scanner_status_ready'), 'HIGH');

    // Simulated frame acquisition loop (throttled to 5 FPS to preserve battery and backpressure)
    frameIntervalRef.current = setInterval(async () => {
      if (isPaused) return;

      // 1. Analyze simulated frame metadata
      const mockLuma = new Uint8Array([110, 115, 120, 130, 140, 150, 160, 170]);
      const prep = imagePreprocessService.analyzeFrameData(mockLuma, 224, 224);

      // 2. Camera guidance
      const guidance = cameraGuidanceEngine.evaluateFrame(prep, {
        x: 60,
        y: 100,
        width: 280,
        height: 140,
      });
      setGuidanceState(guidance);

      // 3. If frame is valid and steady, run inference
      if (prep.isValidForInference && guidance.motion === 'STEADY') {
        if (!isMultiMode) {
          const res = await currencyRecognitionService.classifySingleNote(mockLuma);
          setLatestSingleResult(res);

          if (res.status === 'CONFIRMED' && res.denomination) {
            hapticsService.trigger('SUCCESS');
            announce(
              t('note_identified', { denomination: res.denomination }),
              'HIGH'
            );
          } else if (res.status === 'LOW_CONFIDENCE' || res.status === 'UNCERTAIN') {
            hapticsService.trigger('UNCERTAIN');
          }
        } else {
          const mRes = await currencyRecognitionService.detectMultipleNotes(mockLuma);
          setLatestMultiResult(mRes);

          if (mRes.hasOverlappingNotes) {
            hapticsService.trigger('UNCERTAIN');
            announce(t('guidance_separate_notes'), 'GUIDANCE');
          } else if (mRes.confirmedCount > 0) {
            hapticsService.trigger('SUCCESS');
            announce(
              t('notes_multi_identified', {
                count: mRes.confirmedCount,
                total: mRes.totalValue,
              }),
              'HIGH'
            );
          }
        }
      }
    }, 600); // 600ms interval = ~1.6 FPS inference rate to protect battery

    return () => {
      if (frameIntervalRef.current) {
        clearInterval(frameIntervalRef.current);
      }
      motionSensorService.stopListening();
    };
  }, [isPaused, isMultiMode]);

  const togglePause = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    announce(
      nextPaused ? t('scanner_status_paused') : t('scanner_status_ready'),
      'NORMAL'
    );
  };

  const toggleTorch = () => {
    const nextTorch = !torchActive;
    setTorchActive(nextTorch);
    announce(
      nextTorch ? t('scanner_torch_on') : t('scanner_torch_off'),
      'NORMAL'
    );
  };

  const toggleScanMode = () => {
    const nextMulti = !isMultiMode;
    setIsMultiMode(nextMulti);
    announce(
      nextMulti ? t('scanner_multi_mode') : t('scanner_single_mode'),
      'HIGH'
    );
  };

  const handleAddConfirmedNote = () => {
    if (!isMultiMode) {
      if (latestSingleResult?.denomination && latestSingleResult.status === 'CONFIRMED') {
        addConfirmedNote(latestSingleResult.denomination);
        setLatestSingleResult(null);
      }
    } else {
      if (latestMultiResult && latestMultiResult.confirmedCount > 0) {
        const notesToAdd = latestMultiResult.detectedNotes
          .filter((n) => n.status === 'CONFIRMED')
          .map((n) => ({ denomination: n.denomination }));
        addConfirmedNotes(notesToAdd);
        setLatestMultiResult(null);
      }
    }
  };

  if (!permission) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={[styles.text, { color: theme.text }]}>Checking camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={[styles.text, { color: theme.text }]}>
          Camera permission is required to scan Indian currency notes.
        </Text>
        <AccessibleButton
          label="Grant Camera Permission"
          onPress={requestPermission}
          variant="primary"
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Live Camera Viewfinder */}
      <View style={styles.cameraContainer}>
        {Platform.OS !== 'web' ? (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            enableTorch={torchActive}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' },
            ]}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16 }}>Camera Preview (Web Fallback)</Text>
          </View>
        )}

        <CameraGuidanceOverlay guidance={guidanceState} />
      </View>

      {/* Control Panel */}
      <View style={[styles.controlPanel, { backgroundColor: theme.surface }]}>
        <ScannerStatus
          guidance={guidanceState}
          isPaused={isPaused}
          torchActive={torchActive}
        />

        {/* Confirmation Button for Identified Note */}
        {latestSingleResult?.status === 'CONFIRMED' && latestSingleResult.denomination && (
          <AccessibleButton
            label={`Add ₹${latestSingleResult.denomination} to Wallet`}
            accessibilityHint="Adds confirmed note to your cash wallet total"
            onPress={handleAddConfirmedNote}
            variant="primary"
          />
        )}

        {latestMultiResult && latestMultiResult.confirmedCount > 0 && isMultiMode && (
          <AccessibleButton
            label={`Add ₹${latestMultiResult.totalValue} (${latestMultiResult.confirmedCount} notes) to Wallet`}
            accessibilityHint="Adds all confirmed notes to your cash wallet"
            onPress={handleAddConfirmedNote}
            variant="primary"
          />
        )}

        {/* Action Controls */}
        <View style={styles.actionRow}>
          <AccessibleButton
            label={isPaused ? t('scanner_resume') : t('scanner_pause')}
            onPress={togglePause}
            variant="secondary"
            style={styles.halfBtn}
          />

          <AccessibleButton
            label={torchActive ? 'Turn Off Torch' : 'Turn On Torch'}
            onPress={toggleTorch}
            variant="secondary"
            style={styles.halfBtn}
          />
        </View>

        <AccessibleButton
          label={isMultiMode ? t('scanner_single_mode') : t('scanner_multi_mode')}
          accessibilityHint="Switches between scanning one note at a time and detecting multiple scattered notes"
          onPress={toggleScanMode}
          variant="outline"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  controlPanel: {
    padding: 16,
    borderTopWidth: 2,
    borderTopColor: '#334155',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfBtn: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  text: {
    fontSize: ACCESSIBILITY_METRICS.fontSize.base,
    textAlign: 'center',
    lineHeight: ACCESSIBILITY_METRICS.lineHeight.base,
  },
});
