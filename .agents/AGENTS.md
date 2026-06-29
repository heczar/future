# Project Behavioral Rules for AI Assistants

## Critical Server Integrity Rules

### 1. Do Not Modify Server API Imports and File Extensions
- **Files Affected**: `server.ts`, `api/index.ts`, `api/gemini/*.ts`.
- **Constraint**: Under no circumstances should the imports inside `server.ts` or the `api/` directory be changed from their correct path `./api/gemini/...` to incorrect paths like `./server-api/...`.
- **Constraint**: File extensions in imports must always contain the `.js` extension (e.g. `import ... from "./api/gemini/chatWithAdvisor.js"`). Do not strip these extensions, as the Node.js ES Modules environment on Vercel requires them.
- **Reason**: Modifying these files causes build errors or runtime Serverless Function crashes on Vercel (`ERR_MODULE_NOT_FOUND`, `FUNCTION_INVOCATION_FAILED`).

### 2. UI Adjustments Boundary
- When requested to perform UI adjustments, only modify files inside the `src/` directory (e.g. `src/components/`, `src/App.tsx`, `src/index.css`).
- Never perform automated refactoring on server files unless explicitly instructed to do so.
