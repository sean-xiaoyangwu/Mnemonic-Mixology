
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
  detected_themes: string[]; // Contextual tags e.g., ["Work", "Romance", "Nature"]
}

export interface CocktailRecipe {
  name: string;
  description: string;
  ingredients: string[];
  glassType: string;
  colorHex: string; // For visualization
  garnish: string;
  // [Mod1, Mod2, Mod3, Mod4, Vodka, Whisky, Soda]
  hardwareInstructions: number[]; 
}

export interface FeedbackData {
  rating: number; // 1-5 stars
  notes: string;
  adjustment: string; // e.g., "Too Sweet", "Too Strong", "Perfect"
}

export interface LearnedContext {
  id: string;
  emotion: string; // The primary vector (Joy, Melancholy, etc.)
  tag: string; // The extracted theme (e.g. "Rainy Day")
  modifier: string; // What changed? (e.g. "Increased Sweetness")
  reason: string; // The chemical reasoning derived by AI
  timestamp: number;
  source?: string; // Origin of the learned context
}

export interface MemoryMix {
  id: string;
  timestamp: number;
  transcript: string;
  emotions: EmotionData;
  nlpAnalysis: NlpMetrics;
  cocktail: CocktailRecipe;
  feedback?: FeedbackData;
}