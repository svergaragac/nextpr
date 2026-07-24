import app from "../server";

// Vercel serverless entry point for all /api/* routes.
// An Express app is itself a (req, res) handler, so Vercel's Node runtime
// can invoke it directly. vercel.json rewrites /api/* to this function.
export default app;
