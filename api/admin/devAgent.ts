/**
 * ⚠️ WARNING / ATENCIÓN — CRITICAL PRODUCTION SERVER FILE ⚠️
 * DO NOT MODIFY THIS FILE OR CHANGE ITS IMPORT PATHS / EXTENSIONS.
 * ANY CHANGES TO THIS FILE BY AI AGENTS OR AI STUDIO MUST BE PREVENTED
 * TO AVOID BREAKING THE VERCEL SERVERLESS RUNTIME (ERR_MODULE_NOT_FOUND).
 */

import { getAiClient } from "../gemini/utils.js";
import dotenv from "dotenv";

dotenv.config();

const GITHUB_OWNER = process.env.GITHUB_OWNER || "heczar";
const GITHUB_REPO = process.env.GITHUB_REPO || "future";

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key, x-github-pat');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Auth check - only allow admin email heczaroficial@gmail.com (checked client-side, but let's read token)
  const githubPat = req.headers['x-github-pat'] || process.env.GITHUB_PAT || "";
  const geminiKey = req.headers['x-gemini-api-key'] || process.env.GEMINI_API_KEY || "";

  if (!githubPat) {
    return res.status(401).json({ error: "Falta el token de acceso de GitHub (GITHUB_PAT)." });
  }

  const { action, prompt, filePath, content, sha, commitMessage } = req.body || {};

  try {
    const ai = getAiClient(geminiKey);

    if (action === 'analyze') {
      if (!prompt) return res.status(400).json({ error: "Falta el prompt." });

      // Fetch git tree recursively
      const treeUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/git/trees/main?recursive=1`;
      const treeRes = await fetch(treeUrl, {
        headers: {
          'Authorization': `Bearer ${githubPat}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'FUTURA-Dev-Station'
        }
      });

      if (!treeRes.ok) {
        throw new Error(`Error al leer el repositorio de GitHub: ${treeRes.statusText}`);
      }

      const treeData: any = await treeRes.json();
      const filesList = (treeData.tree || [])
        .filter((node: any) => node.type === 'blob' && (node.path.startsWith('src/') || node.path.startsWith('api/') || node.path === 'server.ts' || node.path === 'index.html'))
        .map((node: any) => node.path);

      // Call Gemini to identify relevant files
      const systemInstruction = `
        Eres el Arquitecto de Software de FUTURA. Analiza la petición del usuario y la lista de archivos del proyecto.
        Determina qué archivo o archivos de código fuente deben modificarse para cumplir con la petición.
        Debes retornar ÚNICAMENTE un objeto JSON con los campos:
        - "explanation": Breve explicación en español de por qué elegiste estos archivos.
        - "files": Arreglo de strings de las rutas relativas de los archivos a modificar, ordenados por relevancia.
        Ejemplo: { "explanation": "Modificaremos Sidebar para el color y App para la ruta", "files": ["src/components/Sidebar.tsx"] }
      `;

      const geminiPrompt = `
        Petición del usuario: "${prompt}"
        Lista de archivos disponibles:
        ${JSON.stringify(filesList, null, 2)}
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: geminiPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });

      const parsedResult = JSON.parse(response.text || "{}");
      return res.status(200).json(parsedResult);
    }

    if (action === 'preview') {
      if (!prompt || !filePath) {
        return res.status(400).json({ error: "Faltan parámetros (prompt o filePath)." });
      }

      // Fetch file content from GitHub
      const fileUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;
      const fileRes = await fetch(fileUrl, {
        headers: {
          'Authorization': `Bearer ${githubPat}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'FUTURA-Dev-Station'
        }
      });

      if (!fileRes.ok) {
        throw new Error(`No se pudo obtener el archivo ${filePath} de GitHub: ${fileRes.statusText}`);
      }

      const fileData: any = await fileRes.json();
      const originalContent = Buffer.from(fileData.content, 'base64').toString('utf8');
      const fileSha = fileData.sha;

      // Ask Gemini to modify the file content
      const systemInstruction = `
        Eres un programador experto del equipo FUTURA. Modifica el código provisto según las instrucciones del usuario.
        Manten intactos todos los comentarios de licencia y la lógica que no tenga relación con la instrucción.
        IMPORTANTE: Retorna únicamente el código de reemplazo completo. No incluyas explicaciones ni bloques de marcado como \`\`\`typescript o \`\`\`tsx.
      `;

      const geminiPrompt = `
        Ruta del archivo: ${filePath}
        Instrucción de modificación: "${prompt}"
        Código fuente original:
        \`\`\`
        ${originalContent}
        \`\`\`
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: geminiPrompt,
        config: {
          systemInstruction
        }
      });

      let modifiedContent = response.text || "";
      // Strip markdown code block ticks if Gemini accidentally included them
      modifiedContent = modifiedContent.replace(/^```[a-zA-Z]*\n/, '').replace(/\n```$/, '');

      return res.status(200).json({
        originalContent,
        modifiedContent,
        sha: fileSha
      });
    }

    if (action === 'commit') {
      if (!filePath || !content || !sha) {
        return res.status(400).json({ error: "Faltan parámetros para realizar el commit." });
      }

      const commitMsg = commitMessage || `refactor(dev-station): ${filePath} modificado vía consola de desarrollo`;
      const base64Content = Buffer.from(content).toString('base64');

      // Update file content on GitHub
      const fileUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;
      const gitRes = await fetch(fileUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${githubPat}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'FUTURA-Dev-Station'
        },
        body: JSON.stringify({
          message: commitMsg,
          content: base64Content,
          sha: sha
        })
      });

      if (!gitRes.ok) {
        const errorText = await gitRes.text();
        throw new Error(`Error de commit en GitHub: ${gitRes.statusText} - ${errorText}`);
      }

      const gitData: any = await gitRes.json();
      return res.status(200).json({
        success: true,
        sha: gitData.commit.sha,
        htmlUrl: gitData.commit.html_url
      });
    }

    return res.status(400).json({ error: "Acción no reconocida." });

  } catch (error: any) {
    console.error("[DEV STATION AGENT ERROR]:", error);
    return res.status(500).json({ error: error.message || "Error interno del agente de desarrollo." });
  }
}
