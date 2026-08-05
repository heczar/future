// Mock Express req and res to test generateCreativeImage handler directly
const dotenv = require("dotenv");
dotenv.config();

const handler = require("../api/gemini/generateCreativeImage.ts").default;

async function run() {
  const req = {
    method: "POST",
    headers: {
      "x-gemini-api-key": process.env.GEMINI_API_KEY || ""
    },
    body: {
      prompt: "odontologia martinez logo",
      aspectRatio: "1:1"
    }
  };

  const res = {
    status: function(code) {
      console.log("Status Code:", code);
      return this;
    },
    json: function(data) {
      console.log("Response JSON:", JSON.stringify(data, null, 2));
      return this;
    },
    setHeader: function(name, val) {
      // noop
    }
  };

  try {
    console.log("Executing server handler...");
    await handler(req, res);
  } catch (err) {
    console.error("Handler threw uncaught exception:", err);
  }
}

run();
