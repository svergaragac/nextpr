import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import app from "./server";

// Local development entry point.
// Reuses the Express app (API routes) from server.ts and adds Vite's dev
// middleware so the frontend and API run together on one port.
// On Vercel this file is NOT used; the static frontend is served by Vercel
// and the API routes run as a serverless function (see api/index.ts).
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[NextPR Server] Running securely on port ${PORT}`);
  });
}

startServer();
