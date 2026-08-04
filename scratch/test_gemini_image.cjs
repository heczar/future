const { GoogleGenAI } = require("@google/genai");
const dotenv = require("dotenv");
dotenv.config();

async function testGeminiImage() {
  console.log("=== Testing Gemini Image Generation Model ===");
  const key = process.env.GEMINI_API_KEY || "";
  console.log("Using API Key:", !!key);

  if (!key) {
    console.log("No GEMINI_API_KEY found.");
    return;
  }

  const ai = new GoogleGenAI({ apiKey: key });

  const modelsToTest = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-image"
  ];

  for (const model of modelsToTest) {
    console.log(`\nGenerating with model: ${model}...`);
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: "Generate a beautiful modern vector coffee cup logo on solid dark background. Return the image inline."
      });

      console.log("Success!");
      // Let's check response candidates and parts
      const parts = response.candidates?.[0]?.content?.parts || [];
      console.log(`Received ${parts.length} parts.`);
      for (const [idx, part] of parts.entries()) {
        console.log(`Part ${idx}:`);
        console.log("  hasText:", !!part.text);
        console.log("  hasInlineData:", !!part.inlineData);
        if (part.inlineData) {
          console.log("  mimeType:", part.inlineData.mimeType);
          console.log("  data length:", part.inlineData.data ? part.inlineData.data.length : 0);
        }
      }
    } catch (err) {
      console.error("Error with model:", err.message);
    }
  }
}

testGeminiImage();
