// Test the API handler locally by mocking req and res
const handler = require('../api/gemini/generateCreativeImage.ts');
const dotenv = require('dotenv');
dotenv.config();

async function runLocalHandlerTest() {
  console.log("=== Testing generateCreativeImage Handler Locally ===");
  console.log("NVIDIA_API_KEY in env:", !!process.env.NVIDIA_API_KEY);
  console.log("GEMINI_API_KEY in env:", !!process.env.GEMINI_API_KEY);

  const req = {
    method: 'POST',
    headers: {
      'x-gemini-api-key': process.env.GEMINI_API_KEY || '',
      'x-nvidia-api-key': process.env.NVIDIA_API_KEY || ''
    },
    body: {
      prompt: "A gorgeous luxury watch on a black obsidian surface",
      aspectRatio: "1:1"
    }
  };

  const res = {
    statusCode: 200,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      console.log("\nResponse Status:", this.statusCode);
      if (data.imageUrl) {
        console.log("✅ Success! ImageUrl (truncated):", data.imageUrl.substring(0, 100) + "...");
        console.log("Image type:", data.imageUrl.startsWith("data:") ? "Base64" : "URL");
      } else {
        console.log("❌ No imageUrl in response:", data);
      }
      return this;
    },
    text() {
      return "";
    },
    end() {
      return this;
    }
  };

  try {
    await handler.default(req, res);
  } catch (err) {
    console.error("❌ Handler threw an exception:", err);
  }
}

runLocalHandlerTest();
