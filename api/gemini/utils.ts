/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClients: Record<string, GoogleGenAI> = {};
export function getAiClient(customKey?: string): GoogleGenAI {
  const key = (customKey && customKey.trim().length > 0) ? customKey : (process.env.GEMINI_API_KEY || "");
  if (!key || key.trim() === "" || key === "MY_GEMINI_API_KEY") {
    throw new Error(
      "La clave 'GEMINI_API_KEY' no está configurada en tu proyecto. Por favor, abre el menú de Configuración (através del ícono de engranaje ⚙️ en el menú superior o lateral de AI Studio), haz clic en 'Secrets' o 'Variables de Entorno' y añade la variable 'GEMINI_API_KEY' con tu clave de API de Gemini."
    );
  }
  if (!aiClients[key]) {
    aiClients[key] = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClients[key];
}

export function robustJsonParse(text: string, defaultPrompt: string): { strategy: string; copy: string; imagePrompt: string; videoProposal?: string } {
  let cleaned = text.replace(/```json\n?|\n?```/g, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      strategy: parsed.strategy || "",
      copy: parsed.copy || "",
      imagePrompt: parsed.imagePrompt || defaultPrompt,
      videoProposal: parsed.videoProposal || ""
    };
  } catch (rawError) {
    console.warn("FUTURA JSON con formato inválido en servidor, iniciando deconstrucción regex...", rawError);
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      const parsedCandidate = JSON.parse(candidate);
      return {
        strategy: parsedCandidate.strategy || "",
        copy: parsedCandidate.copy || "",
        imagePrompt: parsedCandidate.imagePrompt || defaultPrompt,
        videoProposal: parsedCandidate.videoProposal || ""
      };
    } catch (bracketError) {
      // continuar
    }
  }

  let strategy = "";
  let copy = "";
  let imagePrompt = defaultPrompt;
  let videoProposal = "";

  const strategyPatterns = [
    /"strategy"\s*:\s*"([\s\S]*?)"(?=\s*[,}\n])/,
    /"strategy"\s*:\s*"([\s\S]*?)"/
  ];
  for (const pattern of strategyPatterns) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      strategy = match[1];
      break;
    }
  }

  const copyPatterns = [
    /"copy"\s*:\s*"([\s\S]*?)"(?=\s*[,}\n])/,
    /"copy"\s*:\s*"([\s\S]*?)"/
  ];
  for (const pattern of copyPatterns) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      copy = match[1];
      break;
    }
  }

  const imagePromptPatterns = [
    /"imagePrompt"\s*:\s*"([\s\S]*?)"(?=\s*[,}\n])/,
    /"imagePrompt"\s*:\s*"([\s\S]*?)"/
  ];
  for (const pattern of imagePromptPatterns) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      imagePrompt = match[1];
      break;
    }
  }

  const videoPatterns = [
    /"videoProposal"\s*:\s*"([\s\S]*?)"(?=\s*[,}\n])/,
    /"videoProposal"\s*:\s*"([\s\S]*?)"/
  ];
  for (const pattern of videoPatterns) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      videoProposal = match[1];
      break;
    }
  }

  const decodeValue = (val: string) => {
    return val
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\/g, "")
      .replace(/\\'/g, "'")
      .replace(/\\t/g, '\t');
  };

  return {
    strategy: strategy ? decodeValue(strategy) : "La consulta ha sido procesada con éxito por FUTURA.",
    copy: copy ? decodeValue(copy) : "¡Copy listo para publicar! Desata el poder de tu marca con FUTURA.",
    imagePrompt: imagePrompt ? decodeValue(imagePrompt) : defaultPrompt,
    videoProposal: videoProposal ? decodeValue(videoProposal) : ""
  };
}

export function sanitizeGeminiContents(history: any[], newMessage: string, defaultRole: 'user' | 'model' = 'user'): any[] {
  const merged: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
  
  const rawItems = history.map(msg => {
    const role: 'user' | 'model' = msg.role === 'user' ? 'user' : 'model';
    let text = "";
    if (typeof msg.text === 'string') text = msg.text.trim();
    else if (typeof msg.content === 'string') text = msg.content.trim();
    else if (Array.isArray(msg.parts) && msg.parts[0] && typeof msg.parts[0].text === 'string') text = msg.parts[0].text.trim();
    return { role, text };
  }).filter(item => item.text.length > 0);

  if (newMessage && newMessage.trim()) {
    rawItems.push({ role: defaultRole, text: newMessage.trim() });
  }

  for (const item of rawItems) {
    if (merged.length > 0 && merged[merged.length - 1].role === item.role) {
      merged[merged.length - 1].parts[0].text += "\n" + item.text;
    } else {
      merged.push({
        role: item.role,
        parts: [{ text: item.text }]
      });
    }
  }

  if (merged.length === 0) {
    merged.push({
      role: 'user',
      parts: [{ text: newMessage || "Hola Asesor" }]
    });
  }

  return merged;
}
