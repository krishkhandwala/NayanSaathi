# NayanSaathi Machine Learning Models Specification

This document details the on-device models used by NayanSaathi for Indian paper currency recognition.

## 1. Supported Denominations

The models are trained exclusively on the 7 current Mahatma Gandhi New Series Indian currency denominations:
- **₹10** (Chocolate Brown, 123 × 63 mm)
- **₹20** (Greenish Yellow, 129 × 63 mm)
- **₹50** (Fluorescent Blue, 135 × 66 mm)
- **₹100** (Lavender, 142 × 66 mm)
- **₹200** (Bright Yellow, 146 × 66 mm)
- **₹500** (Stone Grey, 150 × 66 mm)
- **₹2000** (Magenta, 166 × 66 mm)

*Note: Coin recognition is excluded from Release 1.0.*

## 2. Model Architectures

### 2.1 Single-Note Classifier
- **Architecture**: MobileNetV3-Small
- **Quantization**: Full integer INT8 quantization with representative dataset calibration.
- **Input Geometry**: 224 × 224 × 3 (RGB), normalized to `[-1, 1]` via `(pixel - 127.5) / 127.5`.
- **Target Size**: Under 15 MB (uncompressed), under 10 MB compressed.
- **Inference Runtime**:
  - Android: LiteRT / TensorFlow Lite with NNAPI delegate fallback to CPU XNNPACK.
  - iOS: Core ML with Apple Neural Engine (ANE) acceleration.

### 2.2 Multiple-Note Detector
- **Architecture**: SSD-MobileNetV2 / YOLOv8-nano
- **Input Geometry**: 300 × 300 × 3
- **Output**: Bounding boxes `[ymin, xmin, ymax, xmax]`, class indices `0..6`, confidence scores `0.0..1.0`.
- **Tracking Pipeline**: Intersection-over-Union (IoU) spatial matching with temporal track IDs to prevent duplicate counting across frames.

## 3. Dataset & Training Pipeline

To retrain or update the model:
1. **Dataset Collection**:
   - Collect 2,500+ high-resolution images per denomination under diverse conditions:
     - Folded and wrinkled notes
     - Soiled / dirty notes
     - Angles up to ±30 degrees
     - 60% partial occlusion
     - Low light (10–30 lux) and bright direct sunlight with glare
     - Diverse backgrounds (wooden tables, bedsheets, tiles, human hands).
2. **Preprocessing**:
   - Color jitter, random rotation (-25° to +25°), perspective warp, blur simulation.
3. **Training Command**:
   ```bash
   python scripts/train_currency_classifier.py \
     --dataset_dir ./data/inr_dataset \
     --model_arch mobilenet_v3_small \
     --epochs 60 \
     --batch_size 32 \
     --output_dir ./models/checkpoints
   ```
4. **TFLite INT8 Export & Post-Training Quantization**:
   ```bash
   python scripts/export_tflite_int8.py \
     --saved_model_dir ./models/checkpoints/best \
     --output_path ./assets/models/currency_mobilenet_int8.tflite \
     --rep_data_dir ./data/calibration_samples
   ```
5. **Core ML Conversion (iOS)**:
   ```bash
   python scripts/convert_coreml.py \
     --tflite_path ./assets/models/currency_mobilenet_int8.tflite \
     --output_path ./assets/models/CurrencyClassifier.mlmodel
   ```

## 4. Verification and Validation Targets
- Single-note recognition latency: `< 40ms` on reference devices.
- Recognition accuracy target: `> 95%` in normal lighting, `> 90%` under low-light / folded conditions.
- Zero network reliance: 100% offline inference.
