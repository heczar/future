/**
 * Vercel Serverless Entrypoint
 * Bridges Vercel /api/index.ts to the compiled Express server bundle.
 */
const app = require("./dist/server.cjs");
module.exports = app.default || app;
