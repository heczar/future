/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Client-side Gemini Service Proxy
// All calls are proxied securely to the server to protect API keys and ensure fast responses.

export async function generateContentStrategy(
  prompt: string,
  context: string,
  styleReferences?: string[],
  logos?: string[],
  history: { role: 'user' | 'model'; content: string }[] = []
) {
  try {
    const res = await fetch("/api/gemini/generateContentStrategy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, context, styleReferences, logos, history })
    });

    if (!res.ok) throw new Error("FUTURA Creative Strategy error");
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Client generateContentStrategy Error:", error);
    return {
      strategy: "Error de conexión con el motor creativo. Verifica la conexión con el servidor FUTURA.",
      copy: "No se pudo generar el copy de la publicación debido a un problema de comunicación.",
      imagePrompt: prompt
    };
  }
}

export async function generateCreativeImage(
  prompt: string,
  aspectRatio: string = "1:1",
  styleReferences?: string[]
): Promise<string | null> {
  try {
    const res = await fetch("/api/gemini/generateCreativeImage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, aspectRatio, styleReferences })
    });

    if (!res.ok) throw new Error("Creative Image Rendering error");
    const data = await res.json();
    return data.imageUrl || null;
  } catch (error) {
    console.error("Client generateCreativeImage Error:", error);
    throw error;
  }
}

export async function chatWithAdvisor(
  message: string,
  history: { role: 'user' | 'model'; text: string }[] = [],
  brandContext?: string
): Promise<string> {
  try {
    const res = await fetch("/api/gemini/chatWithAdvisor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, brandContext })
    });

    if (!res.ok) throw new Error("Advisor service error");
    const data = await res.json();
    return data.response || "No response received";
  } catch (error) {
    console.error("Client chatWithAdvisor Error:", error);
    return "Error en la conexión con la red estratégica de FUTURA (Servidor desconectado).";
  }
}

export async function chatAboutPhase(
  phase: string,
  history: any[],
  message: string
): Promise<string> {
  try {
    const res = await fetch("/api/gemini/chatAboutPhase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase, history, message })
    });

    if (!res.ok) throw new Error("Phase consultation service error");
    const data = await res.json();
    return data.response || "No response received";
  } catch (error) {
    console.error("Client chatAboutPhase Error:", error);
    return "Error en la conexión con el asesor de la etapa seleccionada.";
  }
}

export async function generateSocialCopy(params: {
  copyType: 'advertising' | 'informative' | 'engagement';
  platform: string;
  tone: string;
  clientDetails: string;
  extraContext: string;
  language: 'es' | 'en';
  userRole?: string;
  userBio?: string;
  userPhilosophy?: string;
  projectName?: string;
  projectDescription?: string;
}) {
  try {
    const res = await fetch("/api/gemini/generateSocialCopy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ params })
    });

    if (!res.ok) throw new Error("Copywriter engine error");
    const data = await res.json();
    return data.response || "No se pudo generar el copy.";
  } catch (error) {
    console.error("Client generateSocialCopy Error:", error);
    throw error;
  }
}

export async function refineSocialCopy(
  currentCopy: string,
  refineInstructions: string
): Promise<string> {
  try {
    const res = await fetch("/api/gemini/refineSocialCopy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentCopy, refineInstructions })
    });

    if (!res.ok) throw new Error("Refinement server error");
    const data = await res.json();
    return data.response || currentCopy;
  } catch (error) {
    console.error("Client refineSocialCopy Error:", error);
    throw error;
  }
}
