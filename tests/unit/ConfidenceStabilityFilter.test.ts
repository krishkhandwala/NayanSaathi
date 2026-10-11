import { ConfidenceStabilityFilter } from '../../src/services/recognition/ConfidenceStabilityFilter';

describe('ConfidenceStabilityFilter', () => {
  let filter: ConfidenceStabilityFilter;

  beforeEach(() => {
    filter = new ConfidenceStabilityFilter({
      minConfidenceThreshold: 0.85,
      minConsecutiveFrames: 3,
      announcementCooldownMs: 2000,
    });
  });

  it('rejects low confidence predictions below threshold (< 0.85)', () => {
    const res = filter.processPrediction(100, 0.72, 35);
    expect(res.status).toBe('LOW_CONFIDENCE');
    expect(res.denomination).toBe(100);
  });

  it('rejects predictions with confidence below 0.50 as FAILED', () => {
    const res = filter.processPrediction(500, 0.35, 35);
    expect(res.status).toBe('FAILED');
  });

  it('requires 3 consecutive frames of the same denomination before confirming', () => {
    // Frame 1
    const frame1 = filter.processPrediction(100, 0.92, 35);
    expect(frame1.status).toBe('UNCERTAIN');

    // Frame 2
    const frame2 = filter.processPrediction(100, 0.94, 35);
    expect(frame2.status).toBe('UNCERTAIN');

    // Frame 3
    const frame3 = filter.processPrediction(100, 0.95, 35);
    expect(frame3.status).toBe('CONFIRMED');
    expect(frame3.denomination).toBe(100);
  });

  it('resets consecutive count if a different denomination arrives in between', () => {
    filter.processPrediction(100, 0.92, 35); // Count 1
    filter.processPrediction(100, 0.92, 35); // Count 2
    filter.processPrediction(200, 0.91, 35); // Switches to 200, Count resets to 1
    const frame4 = filter.processPrediction(100, 0.93, 35); // Back to 100, Count 1

    expect(frame4.status).toBe('UNCERTAIN');
  });

  it('enforces announcement cooldown between repeated announcements', () => {
    // Confirm 500
    filter.processPrediction(500, 0.95, 35);
    filter.processPrediction(500, 0.95, 35);
    filter.processPrediction(500, 0.95, 35);

    // Immediate repeat of 500 should be throttled by cooldown
    expect(filter.canAnnounce(500)).toBe(false);
  });
});
