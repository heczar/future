const dotenv = require("dotenv");
// Load env from the project directory
const path = require("path");
dotenv.config({ path: "C:/Users/PC/Projects/future/.env" });

const handler = require("C:/Users/PC/Projects/future/api/gemini/generateCreativeImage.ts").default;

async function run() {
  const req = {
    method: "POST",
    headers: {
      "x-gemini-api-key": process.env.GEMINI_API_KEY || ""
    },
    body: {
      prompt: "Crea un diseño de logotipo profesional para la marca llamada \"Mi Negocio\". Concepto y nicho: barbi te alquila. Estilo: Orgánico y Natural (Botánico). Simple, limpio, fondo oscuro.",
      aspectRatio: "1:1"
    }
  };

  const res = {
    status: function(code) {
      console.log("Status Code:", code);
      return this;
    },
    json: function(data) {
      console.log("Response JSON size:", data?.imageUrl ? data.imageUrl.substring(0, 100) + "..." : "EMPTY");
      if (data?.imageUrl && data.imageUrl.startsWith("https://")) {
        console.log("Returned URL:", data.imageUrl);
      }
      return this;
    },
    setHeader: function(name, val) {
      // noop
    }
  };

  try {
    console.log("Executing specific prompt server handler with absolute paths...");
    await handler(req, res);
  } catch (err) {
    console.error("Handler threw uncaught exception:", err);
  }
}

run();
