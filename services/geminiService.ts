import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { MemoryMix, LearnedContext } from "../types";

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
      description: "Technical NLP analysis of the input text.",
      properties: {
        dominant_sentiment: { type: Type.STRING, enum: ["Positive", "Negative", "Neutral"] },
        sentiment_score: { type: Type.NUMBER, description: "Float between -1.0 (Negative) and 1.0 (Positive)" },
        subjectivity_score: { type: Type.NUMBER, description: "Float between 0.0 (Objective) and 1.0 (Subjective)" },
        irony_probability: { type: Type.NUMBER, description: "Float between 0.0 and 1.0 indicating likelihood of irony/sarcasm" },
        hate_speech_probability: { type: Type.NUMBER, description: "Float between 0.0 and 1.0 safety check" },
        detected_themes: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING }, 
          description: "Extract 2-3 single-word abstract themes (e.g. 'Work', 'Nature', 'Romance', 'Existential', 'Conflict')." 
        }
      },
      required: ["dominant_sentiment", "sentiment_score", "subjectivity_score", "irony_probability", "hate_speech_probability", "detected_themes"]
    },
    emotions: {
      type: Type.OBJECT,
      properties: {
        joy: { type: Type.NUMBER, description: "Score 0-100" },
        melancholy: { type: Type.NUMBER, description: "Score 0-100" },
        stress: { type: Type.NUMBER, description: "Score 0-100" },
        energy: { type: Type.NUMBER, description: "Score 0-100" },
        mystery: { type: Type.NUMBER, description: "Score 0-100" },
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
        glassType: { type: Type.STRING, description: "Recommended glass (e.g., Coupe, Highball, Rocks)" },
        colorHex: { type: Type.STRING, description: "A hex color code representing the drink's liquid color" },
        garnish: { type: Type.STRING, description: "Recommended garnish" },
        hardware_instructions: {
          type: Type.ARRAY,
          items: { type: Type.NUMBER },
          description: "Exact array of 7 integers (mL). 0:Sour, 1:Sweet, 2:Bitter, 3:Fruit, 4:Vodka, 5:Whisky, 6:Soda"
        }
      },
      required: ["name", "description", "ingredients", "glassType", "colorHex", "garnish", "hardware_instructions"],
    },
  },
  required: ["transcript", "nlp_analysis", "emotions", "cocktail"],
};

// Schema for learning from feedback
const learningSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    extracted_tag: { type: Type.STRING, description: "A short, abstract noun representing the user's context (e.g., 'Rain', 'Late Night', 'Breakup'). Max 2 words." },
    chemical_modifier: { type: Type.STRING, description: "A short description of the chemical adjustment implied (e.g., 'Increased Glucose', 'Reduced Acidity')." },
    theoretical_reason: { type: Type.STRING, description: "A scientific sounding reason why this context requires this adjustment (e.g., 'Compensates for low serotonin with sugar')." },
    associated_emotion: { type: Type.STRING, enum: ["Joy", "Melancholy", "Stress", "Energy", "Mystery"], description: "The primary emotion this context falls under." }
  },
  required: ["extracted_tag", "chemical_modifier", "theoretical_reason", "associated_emotion"]
};

export type AudioInput = {
  data: string;
  mimeType: string;
};

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateMixologyProfile = async (input: string | AudioInput): Promise<Omit<MemoryMix, 'id' | 'timestamp'>> => {
  const ai = getAIClient();

  const systemInstruction = `
    You are the 'Mnemonic Mixology' Engine. You translate human narrative into liquid chemistry.

    HARDWARE CONFIGURATION (7 PUMPS):
    [0] Sour/Acid (Lemon) | [1] Sweet (Syrup) | [2] Bitter (Amaro) | [3] Fruit (Triple Sec)
    [4] VODKA (Base 1)    | [5] WHISKY (Base 2) | [6] SODA (Dilution)

    TOTAL VOLUME TARGET: ~320ml (Highball size).

    ALGORITHM STAGE 1: EMOTIONAL BASE (Select Primary Pump)
    - Joy -> Soda (6) dominant (Effervescence).
    - Melancholy -> Whisky (5) dominant (Wood/Age).
    - Stress -> Vodka (4) + Sour (0) (Shock/Reset).
    - Energy -> Vodka (4) + Sweet (1) (Fuel).
    - Mystery -> Split Base + Fruit (3) (Complexity).

    ALGORITHM STAGE 2: CONTEXTUAL MODIFIERS (The 'Themes')
    Analyze the *context* of the emotion to fine-tune modifiers:

    IF JOY:
      - Theme: Social/Party -> Maximize Soda (6) + Fruit (3).
      - Theme: Intimate/Warm -> Increase Sweet (1) + Whisky (5) splash.
    IF MELANCHOLY:
      - Theme: Heartbreak/Loss -> Maximize Bitter (2) + Whisky (5).
      - Theme: Nostalgia -> Sweet (1) + Whisky (5) (Old Fashioned style).
    IF STRESS:
      - Theme: Work/Burnout -> Maximize Sour (0) (Trigeminal wake-up call).
      - Theme: Anxiety/Fear -> Maximize Vodka (4) (Sedative effect).
    IF ENERGY:
      - Theme: Anger/Conflict -> Add Bitter (2) + Sour (0) (Aggressive profile).
      - Theme: Excitement -> Add Sweet (1) + Fruit (3) (Dopamine spike).
    IF MYSTERY:
      - Theme: Confusion -> Cloudy profile (Fruit 3 + Soda 6).
      - Theme: Curiosity -> Herbal profile (Bitter 2 + Fruit 3).

    OUTPUT:
    Return strictly JSON. Ensure 'hardware_instructions' has exactly 7 integers summing roughly to 320ml.
  `;

  try {
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
        hardwareInstructions: data.cocktail.hardware_instructions || [0,0,0,0,0,0,0]
      }
    } as Omit<MemoryMix, 'id' | 'timestamp'>;
    
  } catch (error) {
    console.error("Gemini Mixology Error:", error);
    throw error;
  }
};

export const analyzeFeedbackContext = async (
    originalCocktail: string, 
    originalEmotions: any, 
    userNotes: string,
    adjustment: string
): Promise<Omit<LearnedContext, 'id' | 'timestamp'>> => {
    const ai = getAIClient();

    const systemInstruction = `
        You are the 'Empirical Learning Module' of the Mnemonic Mixology system.
        Your goal is to absorb user feedback to expand the 'Theory Library'.
        
        INPUT:
        - Cocktail: ${originalCocktail}
        - Original Emotions: ${JSON.stringify(originalEmotions)}
        - User Adjustment: ${adjustment}
        - User Notes: "${userNotes}"

        TASK:
        1. Extract a single, abstract 'Context Tag' from the User Notes that explains WHY they needed the adjustment (e.g., if notes say "I missed my mom", tag is "Homesickness").
        2. Assign it to the most relevant Emotion category (Joy, Melancholy, Stress, Energy, Mystery).
        3. Formulate a 'Chemical Modifier' description based on their adjustment (e.g. if 'Too Strong', modifier is 'Reduced Ethanol / Increased Dilution').
        4. Write a 'Theoretical Reason' sounding like a scientific hypothesis (e.g., "Subject requires higher glucose levels to offset cortisol spikes associated with homesickness.").
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: "Analyze this feedback datum." }] }],
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: learningSchema,
                temperature: 0.5
            }
        });

        const text = response.text;
        if (!text) throw new Error("Learning module failed");
        
        const data = JSON.parse(text);

        return {
            emotion: data.associated_emotion,
            tag: data.extracted_tag,
            modifier: data.chemical_modifier,
            reason: data.theoretical_reason,
            source: "User Feedback"
        };

    } catch (error) {
        console.error("Learning Module Error", error);
        // Fallback if AI fails
        return {
            emotion: "Mystery",
            tag: "Unknown Variable",
            modifier: adjustment,
            reason: "User specified manual override. Data insufficient for hypothesis.",
            source: "User Feedback"
        };
    }
};

export const generateSpeech = async (text: string): Promise<string> => {
   const ai = getAIClient();
   const response = await ai.models.generateContent({
     model: 'gemini-2.5-flash-preview-tts',
     contents: [{ parts: [{ text }] }],
     config: {
       responseModalities: [Modality.AUDIO],
       speechConfig: {
         voiceConfig: {
           prebuiltVoiceConfig: { voiceName: 'Fenrir' } 
         }
       }
     }
   });
   const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
   if (!base64) throw new Error("Audio generation failed");
   return base64;
};