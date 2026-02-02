/**
 * Image preprocessing for TensorFlow.js React Native
 * Converts image URI to tensor suitable for model input
 */

import * as tf from "@tensorflow/tfjs";
import { decodeJpeg } from "@tensorflow/tfjs-react-native";
import * as ImageManipulator from "expo-image-manipulator";

/**
 * Preprocess image for model inference
 * @param imageUri - Local file URI of the image
 * @returns Tensor of shape [1, 224, 224, 3] normalized to [0, 1]
 */
export async function preprocessImage(imageUri: string): Promise<tf.Tensor4D> {
  try {
    console.log("🖼️  Preprocessing image:", imageUri);

    // Step 1: Resize image to 224x224
    const resized = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 224, height: 224 } }],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG, base64: false },
    );

    console.log("✅ Image resized to 224x224");

    // Step 2: Read image as binary buffer using fetch (faster than Base64)
    const response = await fetch(resized.uri);
    const imageBuffer = await response.arrayBuffer();
    const rawImageData = new Uint8Array(imageBuffer);

    // Step 3: Decode JPEG to tensor
    let imageTensor = decodeJpeg(rawImageData, 3);

    console.log("✅ Image decoded, shape:", imageTensor.shape);

    // Step 5: Normalize to [0, 1] and add batch dimension
    const floatTensor = imageTensor.toFloat();
    // Normalize by multiplying with 1/255
    const normalized = floatTensor
      .mul(1.0 / 255.0)
      .expandDims(0) as tf.Tensor4D;

    // Dispose intermediate tensors
    imageTensor.dispose();
    floatTensor.dispose();

    console.log("✅ Image preprocessed, final shape:", normalized.shape);

    return normalized;
  } catch (error: unknown) {
    console.error("❌ Image preprocessing error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to preprocess image: ${errorMessage}`);
  }
}

/**
 * Alternative: Preprocess from base64 string
 * @param base64Data - Base64 encoded image data
 * @returns Tensor of shape [1, 224, 224, 3]
 */
export async function preprocessBase64(
  base64Data: string,
): Promise<tf.Tensor4D> {
  try {
    // Remove data URI prefix if present
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(cleanBase64, "base64");
    const rawImageData = new Uint8Array(imageBuffer);

    // Decode JPEG
    let imageTensor = decodeJpeg(rawImageData, 3);

    // Resize if needed using resizeNearestNeighbor
    let processedTensor = imageTensor;
    if (imageTensor.shape[0] !== 224 || imageTensor.shape[1] !== 224) {
      try {
        processedTensor = imageTensor.resizeNearestNeighbor([224, 224]);
        imageTensor.dispose();
      } catch {
        // If resize fails, just use the original tensor
        processedTensor = imageTensor;
      }
    }

    // Normalize and add batch dimension
    const floatTensor = processedTensor.toFloat();
    const normalized = floatTensor
      .mul(1.0 / 255.0)
      .expandDims(0) as tf.Tensor4D;

    processedTensor.dispose();
    floatTensor.dispose();

    return normalized;
  } catch (error: unknown) {
    console.error("❌ Base64 preprocessing error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to preprocess base64: ${errorMessage}`);
  }
}
