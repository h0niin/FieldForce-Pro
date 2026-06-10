import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    const models = await genAI.getGenerativeModel({ model: 'gemini-pro' });
    // wait, list models is not easily exposed. we can just try "gemini-2.0-flash" or "gemini-2.0-flash".
    console.log('Testing gemini-2.0-flash...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const res = await model.generateContent('hi');
    console.log('gemini-2.0-flash success:', res.response.text());
  } catch (err) {
    console.error('gemini-2.0-flash failed:', err.message);
  }
}
listModels();
