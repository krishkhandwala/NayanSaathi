import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useApp } from '../state/AppContext';
import { AccessibleButton } from '../components/AccessibleButton';
import { ScannerStatus } from '../components/ScannerStatus';
import { CameraGuidanceOverlay } from '../components/CameraGuidanceOverlay';
import { cameraGuidanceEngine } from '../services/camera/CameraGuidanceEngine';
import { realCameraRecognitionEngine } from '../services/recognition/RealCameraRecognitionService';
import { imagePreprocessService } from '../services/recognition/ImagePreprocessService';
import { motionSensorService } from '../services/sensors/MotionSensorService';
import { hapticsService } from '../services/haptics/HapticsService';
import { t } from '../localization/i18n';
import { DenominationValue, SingleNoteResult, MultiNoteResult } from '../types/currency';
import { ACCESSIBILITY_METRICS } from '../constants/theme';

type CapturedFrame = {
  pixels: Uint8ClampedArray | Uint8Array;
  width: number;
  height: number;
};

export default function ScannerScreen() {
  const { theme, addConfirmedNote, addConfirmedNotes, announce } = useApp();
  const [permission, requestPermission] = useCameraPermissions();
  const [isPaused, setIsPaused] = useState(false);
  const [torchActive, setTorchActive] = useState(false);
  const [isMultiMode, setIsMultiMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [webCameraReady, setWebCameraReady] = useState(false);
  const [webCameraError, setWebCameraError] = useState<string | null>(null);
  const [latestSingleResult, setLatestSingleResult] = useState<SingleNoteResult | null>(null);
  const [latestMultiResult, setLatestMultiResult] = useState<MultiNoteResult | null>(null);
  const [guidanceState, setGuidanceState] = useState(cameraGuidanceEngine.getState());

  const cameraRef = useRef<CameraView | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanIntervalRef = useRef<any>(null);
  const isBusyRef = useRef(false);

  // Web Webcam Stream Lifecycle
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let localStream: MediaStream | null = null;
    let isSubscribed = true;

    async function startWebcam() {
      try {
        setWebCameraError(null);
        // Try environment camera first (for mobile browsers), fallback to laptop webcam
        try {
          localStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
            audio: false,
          });
        } catch {
          localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        if (isSubscribed && videoRef.current && localStream) {
          videoRef.current.srcObject = localStream;
          await videoRef.current.play().catch(() => {});
          setWebCameraReady(true);
          announce(t('scanner_status_ready'), 'NORMAL');
        }
      } catch (err: any) {
        console.warn('[Webcam] Access error:', err);
        if (isSubscribed) {
          setWebCameraError('Camera access failed. Please ensure camera permissions are allowed in your browser.');
          announce('Camera access was not granted.', 'HIGH');
        }
      }
    }

    startWebcam();

    return () => {
      isSubscribed = false;
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [announce]);

  // Capture pixels from Web Canvas
  const captureWebFrame = useCallback((): CapturedFrame | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    const width = 320;
    const height = 240;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, width, height);
    const imgData = ctx.getImageData(0, 0, width, height);
    return { pixels: imgData.data, width, height };
  }, []);

  // Capture and decode pixels from Mobile CameraView
  const captureMobileFrame = useCallback(async (): Promise<CapturedFrame | null> => {
    if (!cameraRef.current) return null;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.25,
        skipProcessing: true,
      });

      if (!photo?.base64) return null;
      return realCameraRecognitionEngine.decodeMobileBase64(photo.base64);
    } catch (err) {
      console.warn('[Mobile] takePictureAsync failed:', err);
      return null;
    }
  }, []);

  // Core Frame Processor
  const processCurrentFrame = useCallback(async (isManual = false) => {
    if (isPaused || isBusyRef.current) return;
    isBusyRef.current = true;
    setIsProcessing(true);

    try {
      let frameData: CapturedFrame | null = null;

      if (Platform.OS === 'web') {
        frameData = captureWebFrame();
      } else {
        frameData = await captureMobileFrame();
      }

      if (!frameData) {
        if (isManual) {
          announce('Camera is warming up. Please hold note steady and try again in a moment.', 'HIGH');
        }
        isBusyRef.current = false;
        setIsProcessing(false);
        return;
      }

      const { pixels, width, height } = frameData;

      // Extract luma sample for motion & guidance
      const sampleLuma = new Uint8Array(width * height);
      for (let i = 0; i < sampleLuma.length; i++) {
        const idx = i * 4;
        sampleLuma[i] = Math.round(
          0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2]
        );
      }

      const prep = imagePreprocessService.analyzeFrameData(sampleLuma, width, height);
      const guidance = cameraGuidanceEngine.evaluateFrame(prep, {
        x: Math.floor(width * 0.15),
        y: Math.floor(height * 0.15),
        width: Math.floor(width * 0.7),
        height: Math.floor(height * 0.7),
      });
      setGuidanceState(guidance);

      if (!isMultiMode) {
        // Single note classification
        const res = realCameraRecognitionEngine.classifyPixels(pixels, width, height, isManual);
        setLatestSingleResult(res);

        if (res.status === 'CONFIRMED' && res.denomination) {
          hapticsService.trigger('SUCCESS');
          announce(`₹${res.denomination} note identified. Tap Add to Wallet or speak Add to Wallet.`, 'HIGH', true);
        } else if (isManual) {
          if (res.denomination) {
            hapticsService.trigger('UNCERTAIN');
            announce(`Possible ₹${res.denomination} detected. Hold slightly closer and steady to confirm.`, 'HIGH', true);
          } else {
            announce('No note detected. Place currency note in center of camera and tap scan again.', 'HIGH', true);
          }
        }
      } else {
        // Multi-note detection
        const mRes = realCameraRecognitionEngine.detectMultipleNotesFromPixels(
          pixels,
          width,
          height
        );
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
            'HIGH',
            true
          );
        } else if (isManual) {
          announce('No scattered notes detected. Align notes in camera view.', 'HIGH', true);
        }
      }
    } catch (err) {
      console.warn('[Scanner] Frame processing error:', err);
    } finally {
      isBusyRef.current = false;
      setIsProcessing(false);
    }
  }, [isPaused, isMultiMode, captureWebFrame, captureMobileFrame, announce]);

  // Periodic automatic scanner loop
  useEffect(() => {
    motionSensorService.startListening();
    announce(t('scanner_status_ready'), 'HIGH');

    // On web run every 500ms; on mobile every 1000ms
    const intervalMs = Platform.OS === 'web' ? 500 : 1000;
    scanIntervalRef.current = setInterval(() => {
      processCurrentFrame(false);
    }, intervalMs);

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
      motionSensorService.stopListening();
    };
  }, [processCurrentFrame, announce]);

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
        announce(`₹${latestSingleResult.denomination} added to wallet`, 'HIGH');
        setLatestSingleResult(null);
      }
    } else {
      if (latestMultiResult && latestMultiResult.confirmedCount > 0) {
        const notesToAdd = latestMultiResult.detectedNotes
          .filter((n) => n.status === 'CONFIRMED')
          .map((n) => ({ denomination: n.denomination }));
        addConfirmedNotes(notesToAdd);
        announce(`₹${latestMultiResult.totalValue} added to wallet`, 'HIGH');
        setLatestMultiResult(null);
      }
    }
  };

  // Demo fallback test helper for quick verification
  const handleTestSimulate = (denom: DenominationValue) => {
    setLatestSingleResult({
      denomination: denom,
      confidence: 0.95,
      status: 'CONFIRMED',
      timestamp: Date.now(),
      modelVersion: 'simulated-test',
      inferenceTimeMs: 15,
    });
    hapticsService.trigger('SUCCESS');
    announce(`₹${denom} note identified`, 'HIGH');
  };

  if (Platform.OS !== 'web') {
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
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Live Camera Viewfinder */}
      <View style={styles.cameraContainer}>
        {Platform.OS === 'web' ? (
          <View style={StyleSheet.absoluteFill}>
            {/* Real HTML5 Video element for laptop/webcam */}
            {React.createElement('video', {
              ref: (el: HTMLVideoElement | null) => {
                videoRef.current = el;
              },
              autoPlay: true,
              playsInline: true,
              muted: true,
              style: {
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                backgroundColor: '#0f172a',
              },
            })}
            {React.createElement('canvas', {
              ref: (el: HTMLCanvasElement | null) => {
                canvasRef.current = el;
              },
              style: { display: 'none' },
              width: 320,
              height: 240,
            })}
            {webCameraError && (
              <View style={styles.webErrorBanner}>
                <Text style={styles.webErrorText}>{webCameraError}</Text>
              </View>
            )}
          </View>
        ) : (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={torchActive}
          />
        )}

        <CameraGuidanceOverlay guidance={guidanceState} />

        {/* Live Identification Badge */}
        {latestSingleResult?.denomination && (
          <View
            style={[
              styles.detectionBanner,
              {
                backgroundColor:
                  latestSingleResult.status === 'CONFIRMED' ? '#166534' : '#854d0e',
              },
            ]}
          >
            <Text style={styles.detectionBannerText}>
              {latestSingleResult.status === 'CONFIRMED'
                ? `₹${latestSingleResult.denomination} Note Identified (${Math.round(latestSingleResult.confidence * 100)}%)`
                : `Detecting ₹${latestSingleResult.denomination}... (${Math.round(latestSingleResult.confidence * 100)}%)`}
            </Text>
          </View>
        )}

        {isProcessing && (
          <View style={styles.processingIndicator}>
            <ActivityIndicator size="small" color="#38bdf8" />
            <Text style={styles.processingText}>Analyzing frame...</Text>
          </View>
        )}
      </View>

      {/* Control Panel */}
      <View style={[styles.controlPanel, { backgroundColor: theme.surface }]}>
        <ScannerStatus
          guidance={guidanceState}
          isPaused={isPaused}
          torchActive={torchActive}
        />

        {/* Direct Action Button: Trigger Manual Scan */}
        <AccessibleButton
          label="📸 Scan Note Now"
          accessibilityHint="Captures the current camera frame and scans for currency notes"
          onPress={() => processCurrentFrame(true)}
          variant="primary"
          style={{ marginBottom: 8 }}
        />

        {/* Confirmation Button for Identified Note */}
        {latestSingleResult?.status === 'CONFIRMED' && latestSingleResult.denomination && (
          <AccessibleButton
            label={`➕ Add ₹${latestSingleResult.denomination} to Wallet`}
            accessibilityHint="Adds confirmed note to your cash wallet total"
            onPress={handleAddConfirmedNote}
            variant="secondary"
            style={{ marginBottom: 8, backgroundColor: '#059669' }}
          />
        )}

        {latestMultiResult && latestMultiResult.confirmedCount > 0 && isMultiMode && (
          <AccessibleButton
            label={`➕ Add ₹${latestMultiResult.totalValue} (${latestMultiResult.confirmedCount} notes) to Wallet`}
            accessibilityHint="Adds all confirmed notes to your cash wallet"
            onPress={handleAddConfirmedNote}
            variant="secondary"
            style={{ marginBottom: 8, backgroundColor: '#059669' }}
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
            label={torchActive ? 'Torch Off' : 'Torch On'}
            onPress={toggleTorch}
            variant="secondary"
            style={styles.halfBtn}
          />
        </View>

        <View style={[styles.actionRow, { marginTop: 8 }]}>
          <AccessibleButton
            label={isMultiMode ? t('scanner_single_mode') : t('scanner_multi_mode')}
            accessibilityHint="Switches between scanning one note at a time and detecting multiple scattered notes"
            onPress={toggleScanMode}
            variant="outline"
            style={styles.halfBtn}
          />

          <AccessibleButton
            label="Sample ₹100"
            accessibilityHint="Simulates detecting a ₹100 note for verification"
            onPress={() => handleTestSimulate(100)}
            variant="outline"
            style={styles.halfBtn}
          />
        </View>

        <View style={[styles.actionRow, { marginTop: 6 }]}>
          <AccessibleButton
            label="Sample ₹50"
            accessibilityHint="Simulates detecting a ₹50 note for verification"
            onPress={() => handleTestSimulate(50)}
            variant="outline"
            style={styles.halfBtn}
          />
          <AccessibleButton
            label="Sample ₹500"
            accessibilityHint="Simulates detecting a ₹500 note for verification"
            onPress={() => handleTestSimulate(500)}
            variant="outline"
            style={styles.halfBtn}
          />
        </View>
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
    backgroundColor: '#020617',
  },
  controlPanel: {
    padding: 16,
    borderTopWidth: 2,
    borderTopColor: '#334155',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
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
  detectionBanner: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: '#4ade80',
  },
  detectionBannerText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  processingIndicator: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 8,
  },
  processingText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  webErrorBanner: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
  },
  webErrorText: {
    color: '#f87171',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
