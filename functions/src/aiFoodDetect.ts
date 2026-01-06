import * as functions from "firebase-functions";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: functions.config().openai.key,
});

export const aiFoodDetect = functions.https.onRequest(async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      res.status(400).json({ error: "Image required" });
      return;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Identify the food and return JSON { name, caloriesPer100g }",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      temperature: 0.2,
    });

    const raw = response.choices[0].message?.content || "{}";

    const json = JSON.parse(
      raw.substring(raw.indexOf("{"), raw.lastIndexOf("}") + 1)
    );

    res.json({
      name: json.name || "",
      caloriesPer100g: Number(json.caloriesPer100g) || 0,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "AI failed" });
  }
});
