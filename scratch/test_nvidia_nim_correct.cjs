// Prueba rápida de la API de NVIDIA con los parámetros corregidos (prompt, mode, seed, steps)
const dotenv = require("dotenv");
dotenv.config();

async function testNvidiaNIM() {
  const key = process.env.NVIDIA_API_KEY || "";
  console.log("NVIDIA_API_KEY:", key ? `${key.substring(0, 15)}...` : "NO ENCONTRADA");
  
  if (!key) return;
  
  try {
    const res = await fetch("https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-dev", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key.trim()}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        prompt: "A premium coffee cup logo minimalist vector design",
        mode: "base",
        seed: 42,
        steps: 28
      })
    });
    
    console.log("Status:", res.status);
    const data = await res.json();
    if (res.ok) {
      const b64 = data?.artifacts?.[0]?.base64 || data?.data?.[0]?.b64_json || data?.b64_json || data?.image;
      console.log("Tiene base64:", !!b64, b64 ? `(Largo: ${b64.length})` : "");
      console.log("Respuesta completa keys:", Object.keys(data));
      console.log("✅ NVIDIA NIM FUNCIONA CON PARÁMETROS CORREGIDOS");
    } else {
      console.log("❌ Error response:", JSON.stringify(data));
    }
  } catch (err) {
    console.log("❌ Error de red:", err.message);
  }
}

testNvidiaNIM();
