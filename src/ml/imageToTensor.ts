import * as tf from "@tensorflow/tfjs";
import * as FileSystem from "expo-file-system";
import jpeg from "jpeg-js";

/**
 * Decode JPEG binary into Tensor3D
 */
function decodeJpegToTensor(rawImageData: Uint8Array): tf.Tensor3D {
  const { width, height, data } = jpeg.decode(rawImageData, {
    useTArray: true,
  });

  const buffer = new Uint8Array(width * height * 3);
  let offset = 0;

  for (let i = 0; i < data.length; i += 4) {
    buffer[offset++] = data[i];     // R
    buffer[offset++] = data[i + 1]; // G
    buffer[offset++] = data[i + 2]; // B
  }

  return tf.tensor3d(buffer, [height, width, 3]);
}

/**
 * Convert image URI -> Tensor4D [1,224,224,3]
 */
export async function imageToTensor(uri: string): Promise<tf.Tensor4D> {
  // 1. Read image as base64 (string literal, not enum)
  const imgB64 = await FileSystem.readAsStringAsync(uri, {
    encoding: "base64",
  });

  // 2. Base64 -> Uint8Array
  const raw = Uint8Array.from(atob(imgB64), c => c.charCodeAt(0));

  // 3. Decode JPEG
  const imageTensor = decodeJpegToTensor(raw);

  // 4. Resize to model input
  const resized = tf.image.resizeBilinear(imageTensor, [224, 224]);

  // 5. Normalize
  const normalized = resized.div(255);

  // 6. Add batch dimension
  const batched = normalized.expandDims(0) as tf.Tensor4D;

  // 7. Cleanup
  imageTensor.dispose();
  resized.dispose();

  return batched;
}
