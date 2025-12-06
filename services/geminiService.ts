import { GoogleGenAI, Type } from "@google/genai";
import { GeminiInsight } from "../types";

const SYSTEM_INSTRUCTION = `You are a world-class Technical SEO Specialist. 
Your job is to analyze a sample list of URLs from a sitemap and provide high-level insights about the site structure, content types, and potential crawling issues.
Keep your analysis concise, professional, and actionable.`;

export const analyzeUrlsWithGemini = async (urls: string[]): Promise<GeminiInsight> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API Key is missing. Please configure process.env.API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Take a representative sample (first 5, middle 5, last 5) to give context
  const sampleSize = 20;
  const step = Math.max(1, Math.floor(urls.length / sampleSize));
  const sampleUrls = [];
  
  for (let i = 0; i < urls.length; i += step) {
    sampleUrls.push(urls[i]);
    if (sampleUrls.length >= sampleSize) break;
  }

  const prompt = `Here is a sample of URLs from a sitemap (Total URLs in set: ${urls.length}):
  
  ${sampleUrls.join('\n')}
  
  Please analyze this pattern and return a JSON object with:
  1. "category": A 2-3 word classification of these pages (e.g., "E-commerce Product Pages", "Blog Articles", "International Landing Pages").
  2. "structure": A brief description of the URL structure pattern observed.
  3. "seoAdvice": Specific technical SEO advice for this type of URL/content (e.g., about canonicals, hreflang if language codes detected, depth issues).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            structure: { type: Type.STRING },
            seoAdvice: { type: Type.STRING }
          },
          required: ["category", "structure", "seoAdvice"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from Gemini");
    
    return JSON.parse(jsonText) as GeminiInsight;
  } catch (error) {
    console.error("Gemini Analysis Failed", error);
    throw new Error("Failed to generate insights.");
  }
};
