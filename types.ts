export interface EmotionData {
  joy: number;
  melancholy: number;
  stress: number;
  energy: number;
  mystery: number;
}

export interface CocktailRecipe {
  name: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  glassType: string;
  colorHex: string; // For visualization
  garnish: string;
}

export interface MemoryMix {
  id: string;
  timestamp: number;
  transcript: string;
  emotions: EmotionData;
  cocktail: CocktailRecipe;
}
