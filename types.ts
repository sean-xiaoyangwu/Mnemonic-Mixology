export interface EmotionData {
  joy: number;
  melancholy: number;
  stress: number;
  energy: number;
  mystery: number;
}

export interface NlpMetrics {
  dominant_sentiment: string; // e.g., "Positive", "Negative", "Neutral"
  sentiment_score: number; // -1.0 to 1.0 (Polarity)
  subjectivity_score: number; // 0.0 to 1.0 (Objective vs Subjective)
  irony_probability: number; // 0.0 to 1.0
  hate_speech_probability: number; // 0.0 to 1.0 (Safety check)
}

export interface CocktailRecipe {
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  glassType: string;
  colorHex: string; // For visualization
  garnish: string;
  hardwareInstructions: number[]; // [Pump1_ml, Pump2_ml, Pump3_ml, Pump4_ml]
}

export interface MemoryMix {
  id: string;
  timestamp: number;
  transcript: string;
  emotions: EmotionData;
  nlpAnalysis: NlpMetrics;
  cocktail: CocktailRecipe;
}