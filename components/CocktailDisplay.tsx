import React, { useState } from 'react';
import { CocktailRecipe } from '../types';
import { connectToArduino, sendPourCommand, isArduinoConnected, isSimulating } from '../services/arduinoService';
import { Plug, Zap, CheckCircle2, AlertCircle, Monitor } from 'lucide-react';

interface CocktailDisplayProps {
  cocktail: CocktailRecipe;
}

const CocktailDisplay: React.FC<CocktailDisplayProps> = ({ cocktail }) => {
  const [isConnected, setIsConnected] = useState(isArduinoConnected());
  const [isPouring, setIsPouring] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [simMode, setSimMode] = useState(isSimulating());

  const handleConnect = async () => {
    setStatusMsg(null);
    const success = await connectToArduino();
    setIsConnected(success);
    setSimMode(isSimulating());
    
    if (success) {
      if (isSimulating()) {
        setStatusMsg("Simulation Mode Active");
      } else {
        setStatusMsg("Machine Interface Active");
      }
    } else {
      setStatusMsg("Connection Failed");
    }
  };

  const handlePour = async () => {
    if (!isConnected) {
      setStatusMsg("Connect Machine First");
      return;
    }
    
    setIsPouring(true);
    setStatusMsg("Transmitting Signal...");
    
    // Ensure we send exactly 4 integers
    const signals = cocktail.hardwareInstructions || [0,0,0,0];
    
    const success = await sendPourCommand(signals);
    
    if (success) {
      setStatusMsg("Protocol Executed");
      // Reset button state after a short delay
      setTimeout(() => setIsPouring(false), 2000);
    } else {
      setStatusMsg("Transmission Error");
      setIsPouring(false);
    }
  };

  return (
    <div className="w-full max-w-2xl animate-slide-up pb-20">
      
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
        
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

      {/* Hardware Interface Section */}
      <div className="border border-luxury-gray bg-[#0a0a0a] p-6 rounded-sm mt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-xs uppercase tracking-[0.2em] text-subtle-gray flex items-center gap-2">
              <Plug size={14} /> Hardware Link
            </h3>
            {simMode && isConnected && (
              <span className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-luxury-gold border border-luxury-gold/30 px-2 py-0.5 rounded">
                <Monitor size={10} /> Simulation
              </span>
            )}
          </div>
          {statusMsg && (
             <span className={`text-[10px] uppercase tracking-widest ${isConnected ? 'text-green-500' : 'text-red-400'}`}>
               {statusMsg}
             </span>
          )}
        </div>

        {/* Signal Visualization */}
        <div className="grid grid-cols-4 gap-2 mb-8 font-mono">
           {(cocktail.hardwareInstructions || [0,0,0,0]).map((ml, i) => (
              <div key={i} className="flex flex-col items-center gap-2 group">
                 <div className="w-full h-24 bg-luxury-gray relative rounded-sm overflow-hidden">
                    <div 
                      className="absolute bottom-0 left-0 right-0 bg-luxury-gold opacity-50 transition-all duration-1000 group-hover:opacity-70"
                      style={{ height: `${Math.min((ml / 60) * 100, 100)}%` }}
                    ></div>
                 </div>
                 <div className="text-center">
                    <span className="block text-[10px] text-subtle-gray uppercase mb-1">Pump {i+1}</span>
                    <span className="text-lg text-luxury-text">{ml}</span>
                    <span className="text-[9px] text-subtle-gray ml-0.5">ml</span>
                 </div>
              </div>
           ))}
        </div>

        {/* Controls */}
        <div className="flex gap-4 justify-end">
           {!isConnected ? (
              <button 
                onClick={handleConnect}
                className="flex items-center gap-2 px-6 py-3 bg-luxury-gray text-luxury-text text-xs uppercase tracking-widest hover:bg-subtle-gray transition-colors rounded-sm"
              >
                <Plug size={14} /> Connect Dispenser
              </button>
           ) : (
              <button 
                onClick={handlePour}
                disabled={isPouring}
                className={`flex items-center gap-2 px-6 py-3 text-black text-xs uppercase tracking-widest transition-all rounded-sm
                  ${isPouring 
                    ? 'bg-luxury-gold/50 cursor-wait' 
                    : 'bg-luxury-gold hover:bg-[#D5B069] cursor-pointer'
                  }
                `}
              >
                {isPouring ? (
                  <>Processing <span className="animate-pulse">...</span></>
                ) : (
                  <>
                    <Zap size={14} /> Pour Drink
                  </>
                )}
              </button>
           )}
        </div>

      </div>

    </div>
  );
};

export default CocktailDisplay;