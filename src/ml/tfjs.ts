import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";

let ready = false;

export async function initTF() {
  if (!ready) {
    await tf.ready();
    console.log("TFJS ready, backend =", tf.getBackend());
    ready = true;
  }
}
