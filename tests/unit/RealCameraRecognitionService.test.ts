import {
  realCameraRecognitionEngine,
  rgbToHsl,
  analyzePixelRegion,
} from '../../src/services/recognition/RealCameraRecognitionService';
import { DenominationValue } from '../../src/types/currency';

describe('RealCameraRecognitionService', () => {
  beforeEach(() => {
    realCameraRecognitionEngine.reset();
  });

  describe('rgbToHsl', () => {
    it('converts pure red correctly', () => {
      const [h, s, l] = rgbToHsl(255, 0, 0);
      expect(h).toBeCloseTo(0);
      expect(s).toBeCloseTo(1);
      expect(l).toBeCloseTo(0.5);
    });

    it('converts pure white correctly', () => {
      const [h, s, l] = rgbToHsl(255, 255, 255);
      expect(s).toBe(0);
      expect(l).toBe(1);
    });

    it('converts lavender/purple (₹100 signature) correctly', () => {
      // Lavender: R: 160, G: 160, B: 220
      const [h, s, l] = rgbToHsl(160, 160, 220);
      expect(h).toBeGreaterThanOrEqual(220);
      expect(h).toBeLessThanOrEqual(260);
      expect(s).toBeGreaterThan(0.2);
    });
  });

  describe('analyzePixelRegion', () => {
    it('flags too dark frames', () => {
      // 50x50 black image
      const darkBuffer = new Uint8ClampedArray(50 * 50 * 4).fill(10);
      const res = analyzePixelRegion(darkBuffer, 50, 50);
      expect(res.isTooDark).toBe(true);
      expect(res.detectedDenom).toBeNull();
    });

    it('returns null denom on neutral grey desk background', () => {
      // 50x50 neutral grey image (R=128, G=128, B=128, A=255)
      const greyBuffer = new Uint8ClampedArray(50 * 50 * 4);
      for (let i = 0; i < greyBuffer.length; i += 4) {
        greyBuffer[i] = 128;
        greyBuffer[i + 1] = 128;
        greyBuffer[i + 2] = 128;
        greyBuffer[i + 3] = 255;
      }
      const res = analyzePixelRegion(greyBuffer, 50, 50);
      expect(res.isTooDark).toBe(false);
      expect(res.isTooBright).toBe(false);
      expect(res.detectedDenom).toBeNull();
    });

    it('identifies ₹100 lavender note color signature', () => {
      const w = 60, h = 60;
      const buffer = new Uint8ClampedArray(w * h * 4);
      // Fill central region with lavender (R: 165, G: 160, B: 220)
      for (let i = 0; i < buffer.length; i += 4) {
        buffer[i] = 165;
        buffer[i + 1] = 160;
        buffer[i + 2] = 220;
        buffer[i + 3] = 255;
      }
      const res = analyzePixelRegion(buffer, w, h);
      expect(res.detectedDenom).toBe(100);
      expect(res.confidence).toBeGreaterThan(0.7);
    });

    it('identifies ₹500 stone grey/sage tint note signature', () => {
      const w = 60, h = 60;
      const buffer = new Uint8ClampedArray(w * h * 4);
      // Stone grey with sage green tint (R: 125, G: 135, B: 115)
      for (let i = 0; i < buffer.length; i += 4) {
        buffer[i] = 125;
        buffer[i + 1] = 135;
        buffer[i + 2] = 115;
        buffer[i + 3] = 255;
      }
      const res = analyzePixelRegion(buffer, w, h);
      expect(res.detectedDenom).toBe(500);
    });

    it('identifies ₹200 vibrant orange-yellow note signature', () => {
      const w = 60, h = 60;
      const buffer = new Uint8ClampedArray(w * h * 4);
      // Bright yellow (R: 240, G: 185, B: 40)
      for (let i = 0; i < buffer.length; i += 4) {
        buffer[i] = 240;
        buffer[i + 1] = 185;
        buffer[i + 2] = 40;
        buffer[i + 3] = 255;
      }
      const res = analyzePixelRegion(buffer, w, h);
      expect(res.detectedDenom).toBe(200);
    });
  });

  describe('classifyPixels', () => {
    it('confirms detection through confidence stability filter', () => {
      const w = 60, h = 60;
      const buffer = new Uint8ClampedArray(w * h * 4);
      for (let i = 0; i < buffer.length; i += 4) {
        buffer[i] = 165;
        buffer[i + 1] = 160;
        buffer[i + 2] = 220;
        buffer[i + 3] = 255;
      }

      // First prediction establishes candidate
      const res1 = realCameraRecognitionEngine.classifyPixels(buffer, w, h);
      expect(res1.denomination).toBe(100);

      // Subsequent matching predictions confirm it
      realCameraRecognitionEngine.classifyPixels(buffer, w, h);
      const res3 = realCameraRecognitionEngine.classifyPixels(buffer, w, h);
      expect(res3.status).toBe('CONFIRMED');
      expect(res3.denomination).toBe(100);
    });
  });
});
