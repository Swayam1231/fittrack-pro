import * as tf from "@tensorflow/tfjs";
import { imageToTensor } from "./imageToTensor";
import { getFoodModel } from "./FoodModel";

export async function predictFood(imageUri: string): Promise<number[]> {
  const model = await getFoodModel();

  // 1. Create prediction tensor inside tidy
  const predictionTensor = tf.tidy(() => {
    const input = tf.keep(imageToTensor(imageUri) as any); // will be awaited below
    // ⚠️ We cannot await inside tidy, so we restructure below
    return null as any;
  });

  // ❌ The above shows why tidy cannot be async.
  // So we must structure it like this:

  const input = await imageToTensor(imageUri);

  const prediction = tf.tidy(() => {
    return model.predict(input) as tf.Tensor;
  });

  // 2. Extract data outside tidy
  const data = await prediction.data();

  // 3. Cleanup
  prediction.dispose();
  input.dispose();

  return Array.from(data);
}
