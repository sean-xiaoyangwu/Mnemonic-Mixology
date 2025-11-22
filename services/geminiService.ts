import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MemoryMix } from "../types";

// Define the strict output schema for the AI
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    transcript: { 
      type: Type.STRING, 
      description: "A verbatim transcription of the user's audio input, or the text input provided." 
    },
    emotions: {
      type: Type.OBJECT,
      properties: {
        joy: { type: Type.NUMBER, description: "Score 0-100" },
        melancholy: { type: Type.NUMBER, description: "Score 0-100" },
        stress: { type: Type.NUMBER, description: "Score 0-100" },
        energy: { type: Type.NUMBER, description: "Score 0-100" },
        mystery: { type: Type.NUMBER, description: "Score 0-100 based on ambiguity or complexity of the day" },
      },
      required: ["joy", "melancholy", "stress", "energy", "mystery"],
    },
    cocktail: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "A creative, evocative name for the cocktail" },
        description: { type: Type.STRING, description: "A short poetic description connecting the taste to the user's day" },
        ingredients: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of ingredients with measurements"
        },
        instructions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Step by step mixing instructions"
        },
        glassType: { type: Type.STRING, description: "Recommended glass (e.g., Coupe, Highball, Rocks)" },
        colorHex: { type: Type.STRING, description: "A hex color code representing the drink's liquid color" },
        garnish: { type: Type.STRING, description: "Recommended garnish" },
      },
      required: ["name", "description", "ingredients", "instructions", "glassType", "colorHex", "garnish"],
    },
  },
  required: ["transcript", "emotions", "cocktail"],
};

export type AudioInput = {
  data: string;
  mimeType: string;
};

export const generateMixologyProfile = async (input: string | AudioInput): Promise<Omit<MemoryMix, 'id' | 'timestamp'>> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `
    You are a master mixologist and an empathetic psychologist running a high-end, magical speakeasy.
    Your goal is to listen to the user's story about their day and distill it into a unique cocktail recipe.
    
    1. If audio is provided, transcribe it accurately as the 'transcript'. If text is provided, use it as the transcript.
    2. Analyze the sentiment of the content and quantify it into 5 dimensions (Joy, Melancholy, Stress, Energy, Mystery) on a scale of 0-100.
    3. Create a custom cocktail recipe that metaphorically and flavor-wise matches their mood. 
       - High stress? Maybe something herbal and calming or stiff and strong.
       - High joy? Bubbly, bright, citrusy.
       - Melancholy? Smoky, complex, bitter-sweet.
    4. Provide a poetic description of why this drink fits their day.
    5. Return ONLY JSON matching the provided schema.
  `;

  try {
    // Prepare contents based on input type (text or audio)
    let userPart;
    if (typeof input === 'string') {
      userPart = { text: input };
    } else {
      userPart = { 
        inlineData: { 
          data: input.data, 
          mimeType: input.mimeType 
        } 
      };
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Using Flash for multimodal speed
      contents: [
        {
          role: 'user',
          parts: [userPart],
        },
      ],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7, 
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text);
    return data as Omit<MemoryMix, 'id' | 'timestamp'>;
  } catch (error) {
    console.error("Gemini Mixology Error:", error);
    throw error;
  }
};