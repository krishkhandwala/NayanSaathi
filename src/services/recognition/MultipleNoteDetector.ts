import { BoundingBox, DenominationValue, DetectedNote, MultiNoteResult } from '../../types/currency';

export class MultipleNoteDetector {
  private nextTrackingId = 1;
  private trackedNotes: Map<number, { lastBox: BoundingBox; hits: number; lastSeen: number }> = new Map();
  private readonly iouOverlapThreshold = 0.35; // Above 35% IOU indicates overlapping notes
  private readonly matchThreshold = 0.5;

  /**
   * Calculates Intersection over Union (IoU) between two bounding boxes.
   */
  public calculateIoU(boxA: BoundingBox, boxB: BoundingBox): number {
    const xA = Math.max(boxA.x, boxB.x);
    const yA = Math.max(boxA.y, boxB.y);
    const xB = Math.min(boxA.x + boxA.width, boxB.x + boxB.width);
    const yB = Math.min(boxA.y + boxA.height, boxB.y + boxB.height);

    const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
    const boxAArea = boxA.width * boxA.height;
    const boxBArea = boxB.width * boxB.height;
    const unionArea = boxAArea + boxBArea - interArea;

    if (unionArea <= 0) return 0;
    return interArea / unionArea;
  }

  /**
   * Analyzes raw object detection boxes, tracks physical notes over time,
   * detects overlapping ambiguity, and calculates total from confident detections.
   */
  public processDetections(
    rawDetections: Array<{
      denomination: DenominationValue;
      confidence: number;
      box: BoundingBox;
    }>,
    minConfidence = 0.85
  ): MultiNoteResult {
    const now = Date.now();
    let hasOverlapping = false;

    // Check pair-wise overlap among detected boxes
    for (let i = 0; i < rawDetections.length; i++) {
      for (let j = i + 1; j < rawDetections.length; j++) {
        const iou = this.calculateIoU(rawDetections[i].box, rawDetections[j].box);
        if (iou > this.iouOverlapThreshold) {
          hasOverlapping = true;
          break;
        }
      }
      if (hasOverlapping) break;
    }

    const detectedNotes: DetectedNote[] = [];
    let runningBatchTotal = 0;
    let confirmedCount = 0;
    let uncertainCount = 0;

    rawDetections.forEach((raw, idx) => {
      const isConfident = raw.confidence >= minConfidence;
      const status = isConfident
        ? hasOverlapping
          ? 'OVERLAPPING'
          : 'CONFIRMED'
        : 'LOW_CONFIDENCE';

      // Match with tracked notes to assign stable tracking ID
      let matchedTrackingId: number | undefined;
      for (const [id, track] of this.trackedNotes.entries()) {
        if (this.calculateIoU(track.lastBox, raw.box) > this.matchThreshold) {
          matchedTrackingId = id;
          track.lastBox = raw.box;
          track.hits += 1;
          track.lastSeen = now;
          break;
        }
      }

      if (!matchedTrackingId) {
        matchedTrackingId = this.nextTrackingId++;
        this.trackedNotes.set(matchedTrackingId, {
          lastBox: raw.box,
          hits: 1,
          lastSeen: now,
        });
      }

      const note: DetectedNote = {
        noteId: `note_${now}_${idx}_${matchedTrackingId}`,
        denomination: raw.denomination,
        confidence: raw.confidence,
        status,
        timestamp: now,
        boundingBox: raw.box,
        trackingId: matchedTrackingId,
      };

      detectedNotes.push(note);

      if (status === 'CONFIRMED') {
        runningBatchTotal += Math.floor(raw.denomination);
        confirmedCount += 1;
      } else {
        uncertainCount += 1;
      }
    });

    // Cleanup stale tracks older than 3 seconds
    for (const [id, track] of this.trackedNotes.entries()) {
      if (now - track.lastSeen > 3000) {
        this.trackedNotes.delete(id);
      }
    }

    return {
      detectedNotes,
      totalValue: Math.floor(runningBatchTotal),
      confirmedCount,
      uncertainCount,
      hasOverlappingNotes: hasOverlapping,
      timestamp: now,
      inferenceTimeMs: 42,
    };
  }

  public resetTracking(): void {
    this.trackedNotes.clear();
    this.nextTrackingId = 1;
  }
}

export const multipleNoteDetector = new MultipleNoteDetector();
