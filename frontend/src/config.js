// Dynamic Backend API Endpoint URL mapping
// Connects to Vercel environment variables in production, falls back to local localhost on dev.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
