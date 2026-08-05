// Diagnóstico exhaustivo: probar CADA motor de generación uno por uno
const dotenv = require("dotenv");
dotenv.config();

async function testPollinationsDirectURL() {
  console.log("\n=== TEST 1: Pollinations URL directa (sin descargar) ===");
  const prompt = "A premium coffee cup logo minimalist vector dark background";
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&model=flux`;
  console.log("URL generada:", url);
  
  try {
    // Solo verificar que responda con redirect o imagen
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    console.log("Status:", res.status);
    console.log("Content-Type:", res.headers.get("content-type"));
    console.log("✅ Pollinations URL directa FUNCIONA como URL para <img> tag");
  } catch (err) {
    console.log("❌ Error:", err.message);
  }
}

async function testPollinationsDownload() {
  console.log("\n=== TEST 2: Pollinations descargar como base64 (lo que hace el servidor) ===");
  const prompt = "coffee cup product photo";
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&model=flux`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const res = await fetch(url, { redirect: "follow", signal: controller.signal });
    clearTimeout(timeoutId);
    
    console.log("Status:", res.status);
    console.log("Content-Type:", res.headers.get("content-type"));
    
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      console.log("Tamaño imagen:", buf.length, "bytes");
      console.log("✅ Descarga como base64 FUNCIONA");
    } else {
      console.log("❌ No OK:", res.status);
    }
  } catch (err) {
    console.log("❌ Error descargando:", err.message);
  }
}

async function testPollinationsWithSana() {
  console.log("\n=== TEST 3: Pollinations con modelo 'sana' (único activo) ===");
  const prompt = "coffee cup product photo studio lighting";
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&model=sana`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);
    
    const res = await fetch(url, { redirect: "follow", signal: controller.signal });
    clearTimeout(timeoutId);
    
    console.log("Status:", res.status);
    console.log("Content-Type:", res.headers.get("content-type"));
    
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      console.log("Tamaño imagen:", buf.length, "bytes");
      console.log("✅ Modelo sana FUNCIONA");
    } else {
      console.log("❌ No OK:", res.status);
    }
  } catch (err) {
    console.log("❌ Error:", err.message);
  }
}

async function testNvidiaKey() {
  console.log("\n=== TEST 4: NVIDIA NIM API ===");
  const key = process.env.NVIDIA_API_KEY || "";
  console.log("NVIDIA_API_KEY en .env:", key ? `${key.substring(0, 10)}...` : "NO ENCONTRADA");
  
  if (!key) {
    console.log("⚠️ No hay NVIDIA_API_KEY en .env local.");
    console.log("   ¿Está configurada en Vercel? Verificar en dashboard de Vercel.");
    return;
  }
  
  try {
    const res = await fetch("https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-dev", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key.trim()}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        prompt: "A minimalist coffee cup logo on dark background",
        aspect_ratio: "1:1",
        seed: 42,
        num_inference_steps: 28,
        guidance_scale: 3.5
      })
    });
    
    console.log("Status:", res.status);
    if (res.ok) {
      const data = await res.json();
      const b64 = data?.artifacts?.[0]?.base64 || data?.data?.[0]?.b64_json || data?.b64_json || data?.image;
      console.log("Tiene base64:", !!b64, b64 ? `(${b64.length} chars)` : "");
      console.log("✅ NVIDIA NIM FUNCIONA");
    } else {
      const errText = await res.text();
      console.log("❌ Error:", errText.substring(0, 200));
    }
  } catch (err) {
    console.log("❌ Error de red:", err.message);
  }
}

async function testGeminiImagen() {
  console.log("\n=== TEST 5: Google Gemini imagen-3.0-generate-002 ===");
  const key = process.env.GEMINI_API_KEY || "";
  if (!key) { console.log("No GEMINI_API_KEY"); return; }
  
  const { GoogleGenAI } = require("@google/genai");
  const ai = new GoogleGenAI({ apiKey: key });
  
  try {
    const response = await ai.models.generateImages({
      model: "imagen-3.0-generate-002",
      prompt: "A coffee cup logo minimalist",
      config: { numberOfImages: 1, aspectRatio: "1:1" }
    });
    console.log("✅ Imagen 3.0 FUNCIONA");
    console.log("Tiene bytes:", !!response.generatedImages?.[0]?.imageBytes);
  } catch (err) {
    console.log("❌ Imagen 3.0 falla:", err.message?.substring(0, 150));
  }
}

async function testGeminiFlashImage() {
  console.log("\n=== TEST 6: Gemini Flash Image (generateContent con imagen) ===");
  const key = process.env.GEMINI_API_KEY || "";
  if (!key) { console.log("No GEMINI_API_KEY"); return; }
  
  const { GoogleGenAI } = require("@google/genai");
  const ai = new GoogleGenAI({ apiKey: key });
  
  const models = ["gemini-2.5-flash-preview-image"];
  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model: model,
        contents: "Generate a professional minimalist coffee cup logo on solid dark background"
      });
      
      const parts = response.candidates?.[0]?.content?.parts || [];
      let hasImage = false;
      for (const part of parts) {
        if (part.inlineData) {
          hasImage = true;
          console.log(`✅ ${model} devolvió imagen inline (${part.inlineData.mimeType}, ${part.inlineData.data?.length} chars)`);
        }
      }
      if (!hasImage) console.log(`⚠️ ${model} respondió pero sin imagen inline`);
    } catch (err) {
      console.log(`❌ ${model} falla:`, err.message?.substring(0, 120));
    }
  }
}

async function runAll() {
  console.log("╔══════════════════════════════════════════════╗");
  console.log("║  DIAGNÓSTICO COMPLETO DE GENERACIÓN IMAGEN  ║");
  console.log("╚══════════════════════════════════════════════╝");
  
  await testPollinationsDirectURL();
  await testPollinationsWithSana();
  await testPollinationsDownload();
  await testNvidiaKey();
  await testGeminiImagen();
  await testGeminiFlashImage();
  
  console.log("\n════════════════════════════════════");
  console.log("DIAGNÓSTICO COMPLETADO");
  console.log("════════════════════════════════════");
}

runAll();
