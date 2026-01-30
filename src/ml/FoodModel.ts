import * as tf from "@tensorflow/tfjs";
import { initTF } from "./tfjs";

let model: tf.GraphModel | null = null;

export async function getFoodModel(): Promise<tf.GraphModel> {
  if (model) return model;

  await initTF();

  // ⚠️ Put your actual model path here
  const modelJson = require("../assests/food-model/model.json");

  model = await tf.loadGraphModel(modelJson);

  console.log("Food model loaded");

  return model;
}
