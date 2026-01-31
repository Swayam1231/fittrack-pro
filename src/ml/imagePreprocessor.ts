/**
 * Image preprocessing for TensorFlow.js React Native
 * Converts image URI to tensor suitable for model input
 */

import * as tf from '@tensorflow/tfjs';
import * as ImageManipulator from 'expo-image-manipulator';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';

/**
 * Preprocess image for model inference
 * @param imageUri - Local file URI of the image
 * @returns Tensor of shape [1, 224, 224, 3] normalized to [0, 1]
 */
export async function preprocessImage(imageUri: string): Promise<tf.Tensor4D> {
  try {
    console.log('🖼️  Preprocessing image:', imageUri);

    // Step 1: Resize image to 224x224
    const resized = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 224, height: 224 } }],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG, base64: false }
    );

    console.log('✅ Image resized to 224x224');

    // Step 2: Read image as binary buffer using fetch (faster than Base64)
    const response = await fetch(resized.uri);
    const imageBuffer = await response.arrayBuffer();
    const rawImageData = new Uint8Array(imageBuffer);

    // Step 3: Decode JPEG to tensor
    let imageTensor = decodeJpeg(rawImageData, 3);

    console.log('✅ Image decoded, shape:', imageTensor.shape);

    // Step 5: Normalize to [0, 1] and add batch dimension
    const normalized = imageTensor
      .toFloat()
      .div(tf.scalar(255.0))
      .expandDims(0) as tf.Tensor4D;

    // Dispose intermediate tensor
    imageTensor.dispose();

    console.log('✅ Image preprocessed, final shape:', normalized.shape);

    return normalized;
  } catch (error) {
    console.error('❌ Image preprocessing error:', error);
    throw new Error(`Failed to preprocess image: ${error.message}`);
  }
}

/**
 * Alternative: Preprocess from base64 string
 * @param base64Data - Base64 encoded image data
 * @returns Tensor of shape [1, 224, 224, 3]
 */
export async function preprocessBase64(base64Data: string): Promise<tf.Tensor4D> {
  try {
    // Remove data URI prefix if present
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');

    // Convert base64 to buffer
    const imageBuffer = tf.util.encodeString(cleanBase64, 'base64').buffer;
    const rawImageData = new Uint8Array(imageBuffer);

    // Decode JPEG
    let imageTensor = decodeJpeg(rawImageData, 3);

    // Resize if needed
    if (imageTensor.shape[0] !== 224 || imageTensor.shape[1] !== 224) {
      const resized = tf.image.resizeBilinear(imageTensor, [224, 224]);
      imageTensor.dispose();
      imageTensor = resized;
    }

    // Normalize and add batch dimension
    const normalized = imageTensor
      .toFloat()
      .div(tf.scalar(255.0))
      .expandDims(0) as tf.Tensor4D;

    imageTensor.dispose();

    return normalized;
  } catch (error) {
    console.error('❌ Base64 preprocessing error:', error);
    throw new Error(`Failed to preprocess base64: ${error.message}`);
  }
}