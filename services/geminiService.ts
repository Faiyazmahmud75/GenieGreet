
import { GoogleGenAI, Type } from "@google/genai";
import { WishData, GeneratedWish } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

export const generateWish = async (data: WishData): Promise<GeneratedWish> => {
  const prompt = `Generate a personalized, warm, and heartfelt card message for the occasion of ${data.occasion}. 
  The relationship to the recipient is "${data.relationship || 'Friend'}". 
  Keep the message short (max 20 words). 
  CRITICAL: DO NOT include any specific names (sender or recipient) in the message, as they are already printed separately on the card layout. Focus purely on the emotion, the wish, and the celebration itself.
  Return a JSON object with a message, mood, and colorTheme (Tailwind gradient class).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING, description: 'The personalized wish text' },
            mood: { type: Type.STRING, description: 'Single word vibe like festive, cozy, romantic' },
            colorTheme: { type: Type.STRING, description: 'A suggested tailwind bg-gradient class' }
          },
          required: ['message', 'mood', 'colorTheme']
        }
      }
    });

    const result = JSON.parse(response.text);

    return {
      ...result,
      recipientName: data.recipientName,
      senderName: data.senderName,
      occasion: data.occasion
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.toLowerCase().includes('quota')) {
      throw new Error('QUOTA_EXCEEDED');
    }
    throw error;
  }
};
