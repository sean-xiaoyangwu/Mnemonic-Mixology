import React from 'react';
import { CocktailRecipe } from '../types';
import { Droplets, ScrollText } from 'lucide-react';

interface CocktailDisplayProps {
  cocktail: CocktailRecipe;
}

const CocktailDisplay: React.FC<CocktailDisplayProps> = ({ cocktail }) => {
  return (
    <div className="w-full max-w-2xl animate-slide-up">
      
      {/* Header Section */}
      <div className="border-b border-luxury-gray pb-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <span className="block text-luxury-gold text-xs uppercase tracking-[0.3em] mb-3">The Prescription</span>
            <h2 className="text-5xl md:text-6xl font-serif text-luxury-text leading-none">
              {cocktail.name}
            </h2>
          </div>
          <div className="flex items-center gap-6 text-subtle-gray text-xs uppercase tracking-widest font-mono">
            <span>{cocktail.glassType}</span>
            <span className="w-1 h-1 bg-luxury-gold rounded-full"></span>
            <span>{cocktail.garnish}</span>
          </div>
        </div>
        
        <p className="text-lg font-serif text-gray-400 italic leading-relaxed max-w-xl">
          {cocktail.description}
        </p>
      </div>

      {/* Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Ingredients */}
        <div>
          <h3 className="text-xs uppercase tracking-[0.2em] text-subtle-gray mb-6 flex items-center gap-2">
             Composition
          </h3>
          <ul className="space-y-4">
            {cocktail.ingredients.map((ing, idx) => (
              <li key={idx} className="text-luxury-text font-light text-sm flex items-baseline justify-between border-b border-dashed border-luxury-gray pb-2">
                <span>{ing}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div>
          <h3 className="text-xs uppercase tracking-[0.2em] text-subtle-gray mb-6 flex items-center gap-2">
             Ritual
          </h3>
          <ol className="space-y-6">
            {cocktail.instructions.map((step, idx) => (
              <li key={idx} className="text-gray-400 font-light text-sm flex gap-4 leading-relaxed">
                <span className="flex-shrink-0 text-luxury-gold font-serif italic opacity-60">
                  0{idx + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>

    </div>
  );
};

export default CocktailDisplay;