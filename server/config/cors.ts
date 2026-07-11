import { cors } from "hono/cors";

/**
 * Configuration CORS.
 * En production, restreindre à l'origine du client mobile.
 */
export const corsConfig = cors({
  origin: ["http://localhost:5173"],
  allowHeaders: ["Content-Type", "Authorization"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
});
