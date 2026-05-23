// Dynamic Backend API Endpoint URL mapping
// Hardcoded to Hugging Face Space to override any old Vercel environment variables.
export const API_URL = import.meta.env.MODE === 'development' ? "http://localhost:5000" : "";
