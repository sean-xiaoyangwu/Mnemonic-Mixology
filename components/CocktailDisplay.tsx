import React, { useState, useRef, useEffect } from 'react';
import { CocktailRecipe, FeedbackData, EmotionData, NlpMetrics } from '../types';
import { connectToArduino, sendPourCommand, isArduinoConnected, isSimulating } from '../services/arduinoService';
import { generateSpeech } from '../services/geminiService';
import { base64ToUint8Array, pcmToAudioBuffer } from '../services/audioUtils';
import { Plug, Zap, Monitor, Droplets, Wine, Star, Send, Volume2, Loader2, StopCircle, GitCommit, ArrowRight, Activity, GitPullRequest, Tag } from 'lucide-react';

interface CocktailDisplayProps {
  cocktail: CocktailRecipe;
  emotions: EmotionData;
  nlpMetrics?: NlpMetrics;
  existingFeedback?: FeedbackData;
  onSubmitFeedback: (feedback: FeedbackData) => void;
}

const CocktailDisplay: React.FC<CocktailDisplayProps> = ({ cocktail, emotions, nlpMetrics, existingFeedback, onSubmitFeedback }) => {
  const [isConnected, setIsConnected] = useState(isArduinoConnected());
  const [isPouring, setIsPouring] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [simMode, setSimMode] = useState(isSimulating());

  // Audio State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingSpeech, setIsLoadingSpeech] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Feedback State
  const [rating, setRating] = useState<number>(existingFeedback?.rating || 0);
  const [notes, setNotes] = useState<string>(existingFeedback?.notes || '');
  const [adjustment, setAdjustment] = useState<string>(existingFeedback?.adjustment || '');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(!!existingFeedback);

  // Auto-speak on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSpeak();
    }, 1000);
    return () => clearTimeout(timer);
  }, [cocktail.id, cocktail.name]); 

  useEffect(() => {
    return () => stopSpeaking();
  }, [cocktail]);

  const stopSpeaking = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) { /* ignore */ }
      audioSourceRef.current = null;
    }
    setIsSpeaking(false);
  };

  const handleSpeak = async () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    setIsLoadingSpeech(true);
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }

      const textToRead = `${cocktail.name}. ${cocktail.description}.`;
      const base64Audio = await generateSpeech(textToRead);
      
      const audioData = base64ToUint8Array(base64Audio);
      const audioBuffer = pcmToAudioBuffer(audioData, audioContextRef.current);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => setIsSpeaking(false);
      
      audioSourceRef.current = source;
      source.start();
      setIsSpeaking(true);

    } catch (err) {
      console.error("Speech synthesis failed", err);
      setStatusMsg("Speech Generation Failed");
    } finally {
      setIsLoadingSpeech(false);
    }
  };

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
    
    const signals = cocktail.hardwareInstructions || [0,0,0,0,0,0,0];
    const success = await sendPourCommand(signals);
    
    if (success) {
      setStatusMsg("Protocol Executed");
      setTimeout(() => setIsPouring(false), 2000);
    } else {
      setStatusMsg("Transmission Error");
      setIsPouring(false);
    }
  };

  const handleFeedbackSubmit = () => {
    if (rating === 0) return;
    const data: FeedbackData = { rating, notes, adjustment };
    onSubmitFeedback(data);
    setFeedbackSubmitted(true);
  };

  const instructions = cocktail.hardwareInstructions || [0,0,0,0,0,0,0];
  const PINS = [3, 5, 6, 9, 10, 11, 12];

  const renderPump = (idx: number, label: string, ml: number, isBase: boolean) => {
    const maxVal = isBase ? 250 : 60; 
    const percentage = Math.min((ml / maxVal) * 100, 100);

    return (
        <div key={idx} className="flex flex-col items-center gap-2 group relative">
            <div className={`w-full ${isBase ? 'h-32' : 'h-20'} bg-luxury-gray relative rounded-sm overflow-hidden border border-white/5`}>
            <div 
                className={`absolute bottom-0 left-0 right-0 opacity-60 transition-all duration-1000 group-hover:opacity-80
                ${isBase ? 'bg-luxury-gold' : 'bg-subtle-gray'}`}
                style={{ height: `${percentage}%` }}
            ></div>
            </div>
            <div className="text-center">
            <span className="block text-[9px] text-subtle-gray uppercase mb-1 tracking-wider">{label}</span>
            <span className={`text-lg ${isBase ? 'text-luxury-text' : 'text-gray-400'}`}>{ml}</span>
            <span className="text-[9px] text-subtle-gray ml-0.5">ml</span>
            </div>
            <div className="absolute -top-2 right-0 bg-[#111] border border-white/10 px-1 rounded text-[8px] text-subtle-gray font-mono opacity-50">
                PIN {PINS[idx]}
            </div>
        </div>
    );
  };

  const generateLogicTrace = () => {
    const traces = [];
    
    if (emotions.melancholy > 40 && instructions[5] > 0) {
      traces.push({ trigger: "Melancholy", score: emotions.melancholy, target: "Whisky (Base)", amount: instructions[5], reason: "Wood/Age compounds" });
    }
    if (emotions.joy > 40 && instructions[6] > 100) {
      traces.push({ trigger: "Joy", score: emotions.joy, target: "Soda (Effervescence)", amount: instructions[6], reason: "Carbonation/Lift" });
    }
    if (emotions.stress > 40 && instructions[0] > 0) {
      traces.push({ trigger: "Stress", score: emotions.stress, target: "Acid/Sour", amount: instructions[0], reason: "Trigeminal Shock" });
    }
    if (emotions.mystery > 30 && instructions[3] > 0) {
       traces.push({ trigger: "Mystery", score: emotions.mystery, target: "Fruit/Esters", amount: instructions[3], reason: "Complex Volatiles" });
    }
    if (emotions.energy > 50 && instructions[4] > 0) {
        traces.push({ trigger: "Energy", score: emotions.energy, target: "Vodka (Ethanol)", amount: instructions[4], reason: "Pure Fuel" });
    }
    return traces;
  };

  const logicTraces = generateLogicTrace();

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
        
        <div className="relative">
            <p className="text-lg font-serif text-gray-400 italic leading-relaxed max-w-xl pr-12">
            {cocktail.description}
            </p>
            <button 
                onClick={handleSpeak}
                disabled={isLoadingSpeech}
                className="absolute right-0 top-0 text-luxury-gold hover:text-white transition-colors disabled:opacity-50"
                title="Verbalize Recipe"
            >
                {isLoadingSpeech ? (
                    <Loader2 size={20} className="animate-spin" />
                ) : isSpeaking ? (
                    <StopCircle size={20} className="animate-pulse" />
                ) : (
                    <Volume2 size={20} />
                )}
            </button>
        </div>
      </div>

      {/* Algorithmic Derivation Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-2 opacity-70">
                <GitPullRequest size={14} className="text-luxury-gold"/>
                <h3 className="text-xs uppercase tracking-[0.2em] text-subtle-gray">Algorithmic Derivation</h3>
            </div>
            {/* NEW: Detected Themes Display */}
            {nlpMetrics?.detected_themes && nlpMetrics.detected_themes.length > 0 && (
                <div className="flex items-center gap-2">
                    {nlpMetrics.detected_themes.map((theme, i) => (
                        <span key={i} className="text-[9px] uppercase tracking-widest bg-white/5 border border-luxury-gray px-2 py-0.5 rounded text-gray-400 font-mono flex items-center gap-1">
                            <Tag size={8} /> {theme}
                        </span>
                    ))}
                </div>
            )}
        </div>
        
        <div className="bg-[#0f0f0f] border border-luxury-gray/50 rounded-sm p-4 font-mono text-xs">
            {logicTraces.length > 0 ? (
                <div className="space-y-3">
                    {logicTraces.map((trace, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <span className="text-luxury-gold w-24">
                                    {trace.trigger} <span className="text-white/40">{trace.score}%</span>
                                </span>
                                <ArrowRight size={12} className="text-subtle-gray shrink-0" />
                                <span className="text-white w-32">{trace.target}</span>
                            </div>
                            
                            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                <span className="text-subtle-gray italic text-[10px]">{trace.reason}</span>
                                <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded text-white">
                                    <GitCommit size={10} />
                                    <span>{trace.amount}ml</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-subtle-gray italic">Complex derivation. No single dominant vector detected.</p>
            )}
            <div className="mt-4 pt-2 border-t border-dashed border-white/10 text-[10px] text-subtle-gray flex justify-between">
                <span>TOTAL VOLUME: ~320ml</span>
                <span>ALGORITHM: v2.2.0 (Context-Aware)</span>
            </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="mb-12">
        <div className="text-center">
            <h3 className="text-xs uppercase tracking-[0.2em] text-subtle-gray mb-8 inline-flex items-center gap-2">
                Composition
            </h3>
        </div>
        
        <div className="max-w-md mx-auto">
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                {cocktail.ingredients.map((ing, idx) => (
                <li key={idx} className="text-luxury-text font-light text-sm flex items-baseline justify-between border-b border-dashed border-luxury-gray pb-2">
                    <span>{ing}</span>
                </li>
                ))}
            </ul>
        </div>
      </div>

      {/* Hardware Interface Section */}
      <div className="border border-luxury-gray bg-[#0a0a0a] p-6 rounded-sm mt-8">
        <div className="flex items-center justify-between mb-8">
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

        {/* BASES (Row 1) */}
        <div className="mb-2">
            <div className="flex items-center gap-2 mb-4 opacity-50">
                <Wine size={12} className="text-luxury-gold"/>
                <span className="text-[10px] uppercase tracking-widest text-luxury-gold">Base Spirits & Mixers (Fast Pumps)</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-8 font-mono">
                {renderPump(4, "Vodka", instructions[4] || 0, true)}
                {renderPump(5, "Whisky", instructions[5] || 0, true)}
                {renderPump(6, "Soda", instructions[6] || 0, true)}
            </div>
        </div>

        {/* MODIFIERS (Row 2) */}
        <div>
            <div className="flex items-center gap-2 mb-4 opacity-50">
                <Droplets size={12} className="text-subtle-gray"/>
                <span className="text-[10px] uppercase tracking-widest text-subtle-gray">Modifiers (Slow Pumps)</span>
            </div>
            <div className="grid grid-cols-4 gap-2 mb-8 font-mono">
                {renderPump(0, "Sour", instructions[0] || 0, false)}
                {renderPump(1, "Sweet", instructions[1] || 0, false)}
                {renderPump(2, "Bitter", instructions[2] || 0, false)}
                {renderPump(3, "Fruit", instructions[3] || 0, false)}
            </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 justify-end mt-8 border-t border-white/5 pt-6">
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

      {/* User Feedback Section */}
      <div className="mt-12 pt-12 border-t border-luxury-gray/50">
         <h3 className="text-xs uppercase tracking-[0.2em] text-subtle-gray mb-6 text-center">Refine the Algorithm</h3>
         
         {!feedbackSubmitted ? (
             <div className="bg-[#111] p-6 rounded-sm border border-luxury-gray max-w-lg mx-auto">
                <div className="flex justify-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                            key={star} 
                            onClick={() => setRating(star)}
                            className={`transition-colors duration-300 ${rating >= star ? 'text-luxury-gold' : 'text-subtle-gray hover:text-white'}`}
                        >
                            <Star size={24} fill={rating >= star ? "currentColor" : "none"} />
                        </button>
                    ))}
                </div>
                
                <div className="grid grid-cols-3 gap-2 mb-4">
                    {['Too Sweet', 'Perfect', 'Too Bitter', 'Too Strong', 'Weak', 'Strange'].map(adj => (
                        <button
                            key={adj}
                            onClick={() => setAdjustment(adj)}
                            className={`text-[10px] uppercase tracking-wider py-2 border transition-all
                                ${adjustment === adj 
                                    ? 'border-luxury-gold text-luxury-gold bg-luxury-gold/10' 
                                    : 'border-luxury-gray text-subtle-gray hover:border-white hover:text-white'}
                            `}
                        >
                            {adj}
                        </button>
                    ))}
                </div>

                <input 
                    type="text" 
                    placeholder="Additional sensory notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-black border border-luxury-gray text-sm p-3 mb-4 text-white focus:border-luxury-gold outline-none placeholder:text-subtle-gray/50 font-serif italic"
                />

                <button 
                    onClick={handleFeedbackSubmit}
                    disabled={rating === 0}
                    className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 text-xs uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <Send size={12} /> Submit Feedback
                </button>
             </div>
         ) : (
            <div className="text-center animate-fade-in">
                <div className="inline-flex items-center gap-2 text-luxury-gold border border-luxury-gold/30 px-4 py-2 rounded-full bg-luxury-gold/5">
                    <Star size={14} fill="currentColor" />
                    <span className="text-xs uppercase tracking-widest">Input Recorded</span>
                </div>
                <p className="text-subtle-gray text-xs mt-4 font-serif italic">Your preference has been archived.</p>
            </div>
         )}
      </div>

    </div>
  );
};

export default CocktailDisplay;