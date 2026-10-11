import { Accelerometer, Gyroscope } from 'expo-sensors';
import { Subscription } from 'expo-sensors/build/Pedometer';
import { MotionCondition } from '../../types/guidance';

export interface MotionData {
  condition: MotionCondition;
  accelerationMagnitude: number;
  rotationRate: number;
}

export class MotionSensorService {
  private accelSubscription: Subscription | null = null;
  private gyroSubscription: Subscription | null = null;
  private lastAccel = { x: 0, y: 0, z: 1 };
  private lastGyro = { x: 0, y: 0, z: 0 };
  private motionCondition: MotionCondition = 'STEADY';
  private listenerCallback: ((data: MotionData) => void) | null = null;

  // Thresholds for camera shake
  private readonly motionThreshold = 0.35; // g-force delta
  private readonly rotationThreshold = 0.5; // rad/s

  public startListening(callback?: (data: MotionData) => void): void {
    if (callback) {
      this.listenerCallback = callback;
    }

    try {
      Accelerometer.setUpdateInterval(100);
      this.accelSubscription = Accelerometer.addListener((data) => {
        const deltaX = Math.abs(data.x - this.lastAccel.x);
        const deltaY = Math.abs(data.y - this.lastAccel.y);
        const deltaZ = Math.abs(data.z - this.lastAccel.z);
        const deltaTotal = deltaX + deltaY + deltaZ;

        this.lastAccel = data;
        this.evaluateMotion(deltaTotal, this.getRotationMagnitude());
      });

      Gyroscope.setUpdateInterval(100);
      this.gyroSubscription = Gyroscope.addListener((data) => {
        this.lastGyro = data;
        const rotMag = this.getRotationMagnitude();
        this.evaluateMotion(0, rotMag);
      });
    } catch {
      // Sensor not available on web or simulator
      this.motionCondition = 'STEADY';
    }
  }

  private getRotationMagnitude(): number {
    return Math.sqrt(
      this.lastGyro.x * this.lastGyro.x +
      this.lastGyro.y * this.lastGyro.y +
      this.lastGyro.z * this.lastGyro.z
    );
  }

  private evaluateMotion(accelDelta: number, rotationMag: number): void {
    const isExcessive = accelDelta > this.motionThreshold || rotationMag > this.rotationThreshold;
    this.motionCondition = isExcessive ? 'EXCESSIVE_MOTION' : 'STEADY';

    if (this.listenerCallback) {
      this.listenerCallback({
        condition: this.motionCondition,
        accelerationMagnitude: accelDelta,
        rotationRate: rotationMag,
      });
    }
  }

  public getCondition(): MotionCondition {
    return this.motionCondition;
  }

  public stopListening(): void {
    if (this.accelSubscription) {
      this.accelSubscription.remove();
      this.accelSubscription = null;
    }
    if (this.gyroSubscription) {
      this.gyroSubscription.remove();
      this.gyroSubscription = null;
    }
  }
}

export const motionSensorService = new MotionSensorService();
