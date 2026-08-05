// Quick test: verify gemini-3.1-flash-image works with generateContent
const dotenv = require("dotenv");
dotenv.config();

async function test() {
  const { GoogleGenAI } = require("@google/genai");
  const key = process.env.GEMINI_API_KEY || "";
  if (!key) { console.log("No key"); return; }
  
  const ai = new GoogleGenAI({ apiKey: key });
  
  const models = [
    "gemini-3.1-flash-image",
    "gemini-3.1-flash-lite-image",
    "gemini-3-pro-image"
  ];
  
  for (const model of models) {
    console.log(`\nTesting ${model}...`);
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: "Generate a professional minimalist coffee cup logo on solid dark background. Return the image."
      });
      
      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData) {
          console.log(`✅ ${model} WORKS! mimeType=${part.inlineData.mimeType} dataLen=${part.inlineData.data?.length}`);
        } else if (part.text) {
          console.log(`⚠️ ${model} returned text: ${part.text.substring(0, 80)}...`);
        }
      }
      if (parts.length === 0) console.log(`⚠️ ${model} empty response`);
    } catch (err) {
      console.log(`❌ ${model}: ${err.message?.substring(0, 120)}`);
    }
  }
}

test();
