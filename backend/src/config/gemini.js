import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn('WARNING: GEMINI_API_KEY is not defined in the environment variables.');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const getGeminiModel = (options = {}) => {
  if (!genAI) {
    throw new Error('Google Gemini API Key is missing. Please check your GEMINI_API_KEY env variable.');
  }
  const modelName = process.env.CHAT_MODEL || 'gemini-2.5-flash';
  
  return genAI.getGenerativeModel({
    model: modelName,
    ...options
  });
};

export default genAI;
