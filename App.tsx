import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, RotateCcw, History, X, Sparkles, Loader2, Wine, ChevronRight } from 'lucide-react';
import { MemoryMix } from './types';
import { generateMixologyProfile } from './services/geminiService';
import MoodRadar from './components/MoodRadar';
import CocktailDisplay from './components/CocktailDisplay';

// Define the stages of the user journey
type AppStage = 'IDLE' | 'RECORDING' | 'PROCESSING' | 'ANALYZING' | 'SERVED';

const App: React.FC = () => {
  // --- State ---
  const [stage, setStage] = useState<AppStage>('IDLE');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentMix, setCurrentMix] = useState<MemoryMix | null>(null);
  const [archive, setArchive] = useState<MemoryMix[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [title, setTitle] = useState("Mnemonic");

  // --- Initialization ---
  useEffect(() => {
    const stored = localStorage.getItem('mnemonic_mixology_archive');
    if (stored) {
      try {
        setArchive(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load archive", e);
      }
    }

    // Title animation loop
    const interval = setInterval(() => {
      setTitle(prev => prev === "Mnemonic" ? "Mixology" : "Mnemonic");
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // --- Audio Recording Logic ---
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          processAudio(base64String, mimeType);
        };
      };

      mediaRecorder.start();
      setStage('RECORDING');
    } catch (err) {
      console.error("Microphone error:", err);
      setError("Access denied. We cannot hear your story.");
      setStage('IDLE');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && stage === 'RECORDING') {
      mediaRecorderRef.current.stop();
      setStage('PROCESSING');
    }
  };

  const processAudio = async (base64Data: string, mimeType: string) => {
    try {
      const result = await generateMixologyProfile({ data: base64Data, mimeType });
      
      const newMix: MemoryMix = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        ...result
      };

      setTranscript(newMix.transcript);
      setCurrentMix(newMix);
      
      setStage('ANALYZING');
      
      setTimeout(() => {
        setStage('SERVED');
      }, 4000);

      const newArchive = [newMix, ...archive];
      setArchive(newArchive);
      localStorage.setItem('mnemonic_mixology_archive', JSON.stringify(newArchive));

    } catch (err: any) {
      console.error(err);
      setError("The spirits were silent. Try again.");
      setStage('IDLE');
    }
  };

  const resetApp = () => {
    setStage('IDLE');
    setCurrentMix(null);
    setTranscript('');
    setError(null);
  };

  // --- UI Components ---

  return (
    <main className="min-h-screen w-full bg-luxury-black flex flex-col items-center overflow-hidden font-sans text-luxury-text selection:bg-luxury-gold selection:text-black">
      
      {/* Minimal Header */}
      <header className="w-full max-w-7xl p-8 flex justify-between items-center z-30 fixed top-0 left-0 right-0 bg-gradient-to-b from-luxury-black to-transparent">
        <div className="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity cursor-default">
          <div className="w-3 h-3 bg-luxury-gold rounded-full"></div>
          <h1 className="font-serif text-lg tracking-[0.2em] uppercase w-32">
            <span key={title} className="animate-fade-in block">{title}</span>
          </h1>
        </div>
        
        <button 
          onClick={() => setIsHistoryOpen(true)}
          className="group flex items-center gap-2 text-xs uppercase tracking-widest text-subtle-gray hover:text-luxury-gold transition-colors"
        >
          <span>Archive</span>
          <History size={14} />
        </button>
      </header>

      {/* Main Stage */}
      <div className="flex-1 w-full max-w-6xl flex flex-col items-center justify-center relative z-10 mt-20 px-6">
        
        {/* Input Phase */}
        <div className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-1000 ease-out
            ${stage === 'IDLE' || stage === 'RECORDING' || stage === 'PROCESSING' 
              ? 'opacity-100 pointer-events-auto' 
              : 'opacity-0 pointer-events-none scale-95'}`}
        >
          <h2 className="text-4xl md:text-7xl font-serif text-center text-luxury-text mb-12 leading-tight max-w-4xl mx-auto">
            {stage === 'RECORDING' 
              ? <span className="italic text-luxury-gold">Listening...</span> 
              : stage === 'PROCESSING' 
                ? "Distilling Essence" 
                : "How was your day?"}
          </h2>
          
          {stage === 'PROCESSING' ? (
             <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full border border-luxury-gold opacity-20 animate-ping"></div>
                  <div className="w-16 h-16 rounded-full border-t-2 border-luxury-gold animate-spin"></div>
                </div>
                <p className="text-xs uppercase tracking-widest text-subtle-gray mt-8">Analyzing Sentiment</p>
             </div>
          ) : (
            <button
              onClick={stage === 'RECORDING' ? stopRecording : startRecording}
              className={`
                group relative w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center transition-all duration-700
                ${stage === 'RECORDING' 
                  ? 'bg-luxury-gold text-black scale-110' 
                  : 'bg-transparent border border-subtle-gray hover:border-luxury-gold text-luxury-text hover:scale-105'
                }
              `}
            >
              {stage === 'RECORDING' ? (
                <Square size={24} fill="currentColor" className="animate-pulse" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Mic size={28} strokeWidth={1} className="group-hover:text-luxury-gold transition-colors" />
                </div>
              )}
            </button>
          )}

          <div className="mt-12 h-8 flex items-center justify-center">
             {stage === 'IDLE' && (
               <p className="text-subtle-gray text-xs uppercase tracking-[0.3em] animate-fade-in">Tap to Record</p>
             )}
             {stage === 'RECORDING' && (
               <p className="text-luxury-gold text-xs uppercase tracking-[0.3em] animate-pulse">Tap to Finish</p>
             )}
             {error && <p className="text-red-400 text-sm font-serif italic">{error}</p>}
          </div>
        </div>


        {/* Output Phase: Split Layout */}
        <div className={`w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center transition-all duration-1000 delay-300
            ${stage === 'ANALYZING' || stage === 'SERVED' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}
        `}>
          
          {/* Left: Analysis */}
          <div className="lg:col-span-5 flex flex-col items-center lg:items-start h-full justify-center">
             <div className="w-full aspect-square max-w-sm relative mb-8">
                <MoodRadar data={currentMix?.emotions || {joy:0, melancholy:0, stress:0, energy:0, mystery:0}} color={currentMix?.cocktail.colorHex || '#C5A059'} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="w-full h-px bg-gradient-to-r from-transparent via-subtle-gray to-transparent opacity-20 absolute top-1/2"></div>
                   <div className="h-full w-px bg-gradient-to-b from-transparent via-subtle-gray to-transparent opacity-20 absolute left-1/2"></div>
                </div>
             </div>
             
             <div className={`w-full transition-all duration-1000 delay-500 ${stage === 'SERVED' ? 'opacity-50' : 'opacity-100'}`}>
               <h3 className="text-xs font-mono uppercase tracking-widest text-luxury-gold mb-4">Input Transcript</h3>
               <p className="text-xl md:text-2xl font-serif leading-relaxed text-luxury-text italic">
                  "{transcript}"
               </p>
             </div>
          </div>

          {/* Right: Recipe */}
          <div className={`lg:col-span-7 flex flex-col items-center lg:items-end transition-all duration-1000 delay-700
             ${stage === 'SERVED' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}
          `}>
             {currentMix && <CocktailDisplay cocktail={currentMix.cocktail} />}
             
             {stage === 'SERVED' && (
               <div className="mt-12 flex justify-center lg:justify-end w-full animate-fade-in">
                 <button 
                   onClick={resetApp}
                   className="group flex items-center gap-4 px-8 py-4 bg-luxury-gray hover:bg-subtle-gray text-luxury-text transition-all duration-300 rounded-sm"
                 >
                   <RotateCcw size={16} className="group-hover:-rotate-180 transition-transform duration-700" />
                   <span className="uppercase tracking-widest text-xs">Concoct Another</span>
                 </button>
               </div>
             )}
          </div>
        </div>
      </div>

      {/* Archive Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-96 bg-[#0a0a0a] border-l border-luxury-gray z-50 transform transition-transform duration-500 ease-in-out ${isHistoryOpen ? 'translate-x-0' : 'translate-x-full'}`}>
         <div className="p-8 h-full flex flex-col">
            <div className="flex justify-between items-center mb-12">
               <h2 className="font-serif text-3xl italic text-luxury-gold">Collection</h2>
               <button onClick={() => setIsHistoryOpen(false)} className="text-subtle-gray hover:text-white transition-colors">
                  <X size={24} strokeWidth={1} />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
               {archive.map((mix) => (
                  <div 
                     key={mix.id}
                     onClick={() => { 
                       setCurrentMix(mix); 
                       setTranscript(mix.transcript);
                       setStage('SERVED'); 
                       setIsHistoryOpen(false); 
                     }}
                     className="group cursor-pointer border-b border-luxury-gray pb-6 hover:border-luxury-gold transition-colors"
                  >
                     <div className="flex justify-between items-baseline mb-2">
                       <span className="text-xs font-mono text-subtle-gray">{new Date(mix.timestamp).toLocaleDateString()}</span>
                       <ChevronRight size={12} className="text-subtle-gray group-hover:text-luxury-gold group-hover:translate-x-1 transition-all" />
                     </div>
                     <h4 className="text-xl font-serif text-luxury-text group-hover:text-luxury-gold transition-colors mb-1">{mix.cocktail.name}</h4>
                     <p className="text-sm text-subtle-gray line-clamp-2 font-light">{mix.cocktail.description}</p>
                  </div>
               ))}
               {archive.length === 0 && <p className="text-subtle-gray text-center text-sm italic mt-20">Your collection is empty.</p>}
            </div>
         </div>
      </div>
      
      {/* Overlay for sidebar */}
      {isHistoryOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
          onClick={() => setIsHistoryOpen(false)}
        />
      )}

    </main>
  );
};

export default App;