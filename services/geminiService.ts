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
    nlp_analysis: {
      type: Type.OBJECT,
      description: "Technical NLP analysis of the input text, simulating a RoBERTa-base sentiment model.",
      properties: {
        dominant_sentiment: { type: Type.STRING, enum: ["Positive", "Negative", "Neutral"] },
        sentiment_score: { type: Type.NUMBER, description: "Float between -1.0 (Negative) and 1.0 (Positive)" },
        subjectivity_score: { type: Type.NUMBER, description: "Float between 0.0 (Objective) and 1.0 (Subjective)" },
        irony_probability: { type: Type.NUMBER, description: "Float between 0.0 and 1.0 indicating likelihood of irony/sarcasm" },
        hate_speech_probability: { type: Type.NUMBER, description: "Float between 0.0 and 1.0 safety check" },
      },
      required: ["dominant_sentiment", "sentiment_score", "subjectivity_score", "irony_probability", "hate_speech_probability"]
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
        hardware_instructions: {
          type: Type.ARRAY,
          items: { type: Type.NUMBER },
          description: "Exact array of 4 integers representing milliliters for Pumps 1-4. Pump 1: Base Spirit, Pump 2: Liqueur/Modifier, Pump 3: Juice/Acid, Pump 4: Syrup/Sweetener. Example: [45, 15, 20, 10]"
        }
      },
      required: ["name", "description", "ingredients", "instructions", "glassType", "colorHex", "garnish", "hardware_instructions"],
    },
  },
  required: ["transcript", "nlp_analysis", "emotions", "cocktail"],
};

export type AudioInput = {
  data: string;
  mimeType: string;
};

export const generateMixologyProfile = async (input: string | AudioInput): Promise<Omit<MemoryMix, 'id' | 'timestamp'>> => {
  // Support both standard Node process.env and Vite's import.meta.env
  const apiKey = (import.meta as any).env?.VITE_API_KEY || process.env.API_KEY;

  if (!apiKey) {
    throw new Error("API Key is missing. Please set VITE_API_KEY in your .env file.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
    You are an advanced dual-core system: 
    1. A rigorous NLP Engine (simulating tweetnlp/RoBERTa) for text analysis.
    2. A Master Mixologist & Psychologist for creative synthesis.

    PROCESS:
    1. Transcribe/Ingest the user's input about their day.
    
    2. PERFORM TECHNICAL NLP ANALYSIS:
       - Determine the Dominant Sentiment (Positive/Negative/Neutral).
       - Calculate a Polarity Score (-1.0 to 1.0).
       - Assess Subjectivity (0.0 Fact-based to 1.0 Opinion/Emotion-based).
       - Detect potential Irony/Sarcasm (0.0 to 1.0).
    
    3. PERFORM EMOTIONAL MAPPING:
       - Map the nuance of the text to 5 dimensions: Joy, Melancholy, Stress, Energy, Mystery (0-100).
    
    4. CONCOCT RECIPE & HARDWARE INSTRUCTIONS:
       - Create a unique cocktail that chemically represents the user's state.
       - TRANSLATE the recipe into controls for a 4-Pump Machine:
         * Pump 1 (Base Spirit): e.g., Vodka, Gin, Whiskey.
         * Pump 2 (Modifier): e.g., Vermouth, Campari, Liqueur.
         * Pump 3 (Acid/Juice): e.g., Lemon, Lime.
         * Pump 4 (Sweet/Syrup): e.g., Simple Syrup, Honey, Grenadine.
       - You MUST populate 'hardware_instructions' with exactly 4 integers representing MILLILITERS (e.g., [50, 20, 15, 10]).
       - If a category isn't used, set it to 0. Total volume should be roughly 80-120ml.
    
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
      model: 'gemini-2.5-flash', 
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
    
    return {
      transcript: data.transcript,
      emotions: data.emotions,
      nlpAnalysis: data.nlp_analysis,
      cocktail: {
        ...data.cocktail,
        // Map the snake_case JSON response to camelCase TS type if needed, 
        // though our schema uses snake_case for hardware_instructions to match prompt, let's remap
        hardwareInstructions: data.cocktail.hardware_instructions || [0,0,0,0]
      }
    } as Omit<MemoryMix, 'id' | 'timestamp'>;
    
  } catch (error) {
    console.error("Gemini Mixology Error:", error);
    throw error;
  }
};