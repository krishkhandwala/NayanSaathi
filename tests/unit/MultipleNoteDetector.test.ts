import { MultipleNoteDetector } from '../../src/services/recognition/MultipleNoteDetector';
import { BoundingBox } from '../../src/types/currency';

describe('MultipleNoteDetector', () => {
  let detector: MultipleNoteDetector;

  beforeEach(() => {
    detector = new MultipleNoteDetector();
  });

  describe('IoU Calculation', () => {
    it('returns 0 for completely disjoint non-overlapping bounding boxes', () => {
      const boxA: BoundingBox = { x: 0, y: 0, width: 50, height: 50 };
      const boxB: BoundingBox = { x: 100, y: 100, width: 50, height: 50 };
      expect(detector.calculateIoU(boxA, boxB)).toBe(0);
    });

    it('returns 1 for identical bounding boxes', () => {
      const boxA: BoundingBox = { x: 20, y: 30, width: 100, height: 60 };
      const boxB: BoundingBox = { x: 20, y: 30, width: 100, height: 60 };
      expect(detector.calculateIoU(boxA, boxB)).toBeCloseTo(1.0);
    });

    it('calculates accurate partial IoU overlap', () => {
      const boxA: BoundingBox = { x: 0, y: 0, width: 100, height: 100 };
      const boxB: BoundingBox = { x: 50, y: 0, width: 100, height: 100 };
      // Intersection = 50 * 100 = 5000. Union = 10000 + 10000 - 5000 = 15000. IoU = 5000 / 15000 = 1/3 ~ 0.333
      expect(detector.calculateIoU(boxA, boxB)).toBeCloseTo(0.333, 2);
    });
  });

  describe('Multi-Note Processing & Overlap Warning', () => {
    it('accurately sums total for distinct non-overlapping notes', () => {
      const detections = [
        {
          denomination: 500 as const,
          confidence: 0.95,
          box: { x: 10, y: 10, width: 80, height: 40 },
        },
        {
          denomination: 100 as const,
          confidence: 0.92,
          box: { x: 150, y: 10, width: 80, height: 40 },
        },
      ];

      const res = detector.processDetections(detections);
      expect(res.confirmedCount).toBe(2);
      expect(res.totalValue).toBe(600);
      expect(res.hasOverlappingNotes).toBe(false);
    });

    it('flags hasOverlappingNotes when notes exceed overlap threshold (IoU > 0.35)', () => {
      const detections = [
        {
          denomination: 500 as const,
          confidence: 0.95,
          box: { x: 10, y: 10, width: 100, height: 60 },
        },
        {
          denomination: 200 as const,
          confidence: 0.91,
          box: { x: 30, y: 20, width: 100, height: 60 }, // Substantial overlap
        },
      ];

      const res = detector.processDetections(detections);
      expect(res.hasOverlappingNotes).toBe(true);
      expect(res.detectedNotes[0].status).toBe('OVERLAPPING');
    });

    it('excludes uncertain / low-confidence detections from the total', () => {
      const detections = [
        {
          denomination: 500 as const,
          confidence: 0.95,
          box: { x: 10, y: 10, width: 80, height: 40 },
        },
        {
          denomination: 200 as const,
          confidence: 0.65, // Below 0.85 threshold
          box: { x: 150, y: 10, width: 80, height: 40 },
        },
      ];

      const res = detector.processDetections(detections);
      expect(res.confirmedCount).toBe(1);
      expect(res.uncertainCount).toBe(1);
      expect(res.totalValue).toBe(500); // 200 is excluded!
    });
  });
});
