# NayanSaathi Performance & Battery Benchmarking

This document specifies the target performance metrics, latency budgets, and thermal management strategies for NayanSaathi.

---

## 1. Latency & Resource Budgets

| Metric | Target Budget | Typical Measured Value | Enforcement Mechanism |
| :--- | :--- | :--- | :--- |
| **Model Inference Latency** | `< 50 ms` per frame | `32 ms – 38 ms` (INT8) | INT8 full quantization + hardware delegate (NNAPI / Core ML ANE). |
| **End-to-End Announcement** | `< 120 ms` | `90 ms` | Priority queue speech dispatch; background pre-initialization of TTS. |
| **Camera Sampling Rate** | `1.5 – 2.0 FPS` | `1.6 FPS` (600ms tick) | Throttled inference loop in `ScannerScreen` avoids processing every single 30 FPS camera frame. |
| **App Startup Time** | `< 1.5 seconds` | `0.9 seconds` | Lazy evaluation of multi-note models; asynchronous SQLite hydration. |
| **Peak Memory Usage** | `< 120 MB` | `68 MB – 85 MB` | Zero frame caching; prompt garbage collection of image buffers. |
| **Battery Drain Rate** | `< 5%` per 20 mins of active scanning | `3.8%` per 20 mins | Sensor rate set to 100ms; camera preview paused when backgrounded. |

---

## 2. Thermal Management Strategy

Continuous camera preview coupled with continuous neural network execution can generate device heat on entry-level Android devices. NayanSaathi incorporates three active thermal safeguards:

1. **Adaptive Frame Throttling**:
   - When no currency note is detected in the viewfinder for more than 5 seconds, the inference interval automatically increases from 600 ms to 1000 ms.
   - When a note enters the frame, sampling returns to 600 ms.
2. **Background Auto-Pause**:
   - When the user navigates away from the scanner screen or locks the device, camera processing and motion sensor subscriptions are terminated immediately.
3. **Motion Jitter Gate**:
   - If excessive phone motion is flagged by `MotionSensorService`, ML inference is skipped until the device stabilizes. This prevents wasting CPU/NPU cycles on guaranteed blurred frames.
