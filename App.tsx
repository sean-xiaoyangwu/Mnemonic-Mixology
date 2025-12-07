import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, RotateCcw, History, X, BookOpen, Loader2, Wine, ChevronRight, Activity, Terminal, Star } from 'lucide-react';
import { MemoryMix, FeedbackData, LearnedContext } from './types';
import { generateMixologyProfile, generateSpeech, analyzeFeedbackContext } from './services/geminiService';
import { base64ToUint8Array, pcmToAudioBuffer } from './services/audioUtils';
import MoodRadar from './components/MoodRadar';
import CocktailDisplay from './components/CocktailDisplay';
import TheoryLibrary from './components/TheoryLibrary';

// Define the stages of the user journey
type AppStage = 'IDLE' | 'RECORDING' | 'PROCESSING' | 'ANALYZING' | 'SERVED';

const App: React.FC = () => {
  // --- State ---
  const [stage, setStage] = useState<AppStage>('IDLE');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTheoryOpen, setIsTheoryOpen] = useState(false);
  const [currentMix, setCurrentMix] = useState<MemoryMix | null>(null);
  const [archive, setArchive] = useState<MemoryMix[]>([]);
  const [learnedContexts, setLearnedContexts] = useState<LearnedContext[]>([]); // New State
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const [title, setTitle] = useState("Mnemonic");

  // --- Audio Feedback System ---
  const sysAudioCtx = useRef<AudioContext | null>(null);
  const sysAudioSource = useRef<AudioBufferSourceNode | null>(null);

  const playSystemVoice = async (text: string) => {
    try {
      // Stop any currently playing system voice to avoid overlap
      if (sysAudioSource.current) {
        try { sysAudioSource.current.stop(); } catch(e) {}
      }

      // Initialize context if needed (requires user interaction first, which happens via buttons)
      if (!sysAudioCtx.current) {
        sysAudioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      
      const base64 = await generateSpeech(text);
      const audioData = base64ToUint8Array(base64);
      const buffer = pcmToAudioBuffer(audioData, sysAudioCtx.current);
      
      const source = sysAudioCtx.current.createBufferSource();
      source.buffer = buffer;
      source.connect(sysAudioCtx.current.destination);
      source.start();
      sysAudioSource.current = source;
    } catch (e) {
      console.error("System voice error", e);
    }
  };

  const stopSystemVoice = () => {
    if (sysAudioSource.current) {
      try { sysAudioSource.current.stop(); } catch(e) {}
      sysAudioSource.current = null;
    }
  };

  // --- Initialization ---
  useEffect(() => {
    // Load Archive
    const storedArchive = localStorage.getItem('mnemonic_mixology_archive');
    if (storedArchive) {
      try {
        setArchive(JSON.parse(storedArchive));
      } catch (e) {
        console.error("Failed to load archive", e);
      }
    }

    // Load Learned Contexts
    const storedLearned = localStorage.getItem('mnemonic_mixology_learned');
    if (storedLearned) {
        try {
            setLearnedContexts(JSON.parse(storedLearned));
        } catch (e) {
            console.error("Failed to load learned contexts", e);
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
    stopSystemVoice(); // Stop any previous speech
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
      // Trigger the transition voice
      playSystemVoice("Converting your story into liquid data.");
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
        // Stop the "Converting..." voice if it's still playing before the new one starts
        stopSystemVoice();
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

  const handleUpdateFeedback = async (feedback: FeedbackData) => {
    if (!currentMix) return;

    // 1. Update current mix locally
    const updatedMix = { ...currentMix, feedback };
    setCurrentMix(updatedMix);

    // 2. Update archive
    const updatedArchive = archive.map(mix => 
        mix.id === updatedMix.id ? updatedMix : mix
    );
    setArchive(updatedArchive);
    localStorage.setItem('mnemonic_mixology_archive', JSON.stringify(updatedArchive));

    // 3. LEARN from feedback (if notes are provided)
    if (feedback.notes.length > 5) {
        // Optimistic UI: Don't block the UI, process in background
        playSystemVoice("Analyzing your feedback for future calibration.");
        
        try {
            const learned = await analyzeFeedbackContext(
                currentMix.cocktail.name,
                currentMix.emotions,
                feedback.notes,
                feedback.adjustment
            );
            
            const newContext: LearnedContext = {
                id: Date.now().toString(),
                timestamp: Date.now(),
                ...learned
            };

            const updatedLearned = [newContext, ...learnedContexts];
            setLearnedContexts(updatedLearned);
            localStorage.setItem('mnemonic_mixology_learned', JSON.stringify(updatedLearned));
            
        } catch (e) {
            console.error("Learning failed", e);
        }
    }
  };

  const resetApp = () => {
    stopSystemVoice();
    setStage('IDLE');
    setCurrentMix(null);
    setTranscript('');
    setError(null);
    // Optional: Prompt the user to start again
    playSystemVoice("I am ready to listen.");
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
        
        <div className="flex items-center gap-8">
            <button 
                onClick={() => setIsTheoryOpen(true)}
                className="group flex items-center gap-2 text-xs uppercase tracking-widest text-subtle-gray hover:text-luxury-text transition-colors"
            >
                <span>Library</span>
                <BookOpen size={14} />
            </button>
            <button 
                onClick={() => setIsHistoryOpen(true)}
                className="group flex items-center gap-2 text-xs uppercase tracking-widest text-subtle-gray hover:text-luxury-gold transition-colors"
            >
                <span>Archive</span>
                <History size={14} />
            </button>
        </div>
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
             {/* Radar Chart */}
             <div className="w-full aspect-square max-w-sm relative mb-8">
                <MoodRadar data={currentMix?.emotions || {joy:0, melancholy:0, stress:0, energy:0, mystery:0}} color={currentMix?.cocktail.colorHex || '#C5A059'} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="w-full h-px bg-gradient-to-r from-transparent via-subtle-gray to-transparent opacity-20 absolute top-1/2"></div>
                   <div className="h-full w-px bg-gradient-to-b from-transparent via-subtle-gray to-transparent opacity-20 absolute left-1/2"></div>
                </div>
             </div>

             {/* NLP Diagnostics Panel */}
             <div className={`w-full max-w-sm border-t border-luxury-gray pt-6 mt-2 transition-all duration-1000 delay-500 
                ${stage === 'SERVED' ? 'opacity-100' : 'opacity-0'}
             `}>
                <div className="flex items-center gap-2 mb-4 text-luxury-gold">
                  <Terminal size={12} />
                  <span className="text-xs font-mono uppercase tracking-widest">NLP Diagnostics</span>
                </div>
                
                {currentMix?.nlpAnalysis && (
                  <div className="grid grid-cols-2 gap-4 font-mono text-xs text-subtle-gray">
                    <div className="flex flex-col gap-1">
                      <span className="uppercase text-[10px] tracking-widest opacity-50">Polarity</span>
                      <span className="text-luxury-text">
                        {currentMix.nlpAnalysis.sentiment_score > 0 ? '+' : ''}{currentMix.nlpAnalysis.sentiment_score.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="uppercase text-[10px] tracking-widest opacity-50">Subjectivity</span>
                      <span className="text-luxury-text">
                        {(currentMix.nlpAnalysis.subjectivity_score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="uppercase text-[10px] tracking-widest opacity-50">Irony</span>
                      <span className="text-luxury-text">
                        {currentMix.nlpAnalysis.irony_probability > 0.6 ? 'DETECTED' : 'LOW'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="uppercase text-[10px] tracking-widest opacity-50">Sentiment</span>
                      <span className={`text-luxury-text ${currentMix.nlpAnalysis.dominant_sentiment === 'Positive' ? 'text-green-400' : currentMix.nlpAnalysis.dominant_sentiment === 'Negative' ? 'text-red-400' : 'text-gray-400'}`}>
                        {currentMix.nlpAnalysis.dominant_sentiment.toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
             </div>
             
             {/* Transcript (Visual fade out slightly to focus on data) */}
             <div className={`w-full mt-6 transition-all duration-1000 delay-500 ${stage === 'SERVED' ? 'opacity-40 hover:opacity-100 transition-opacity' : 'opacity-100'}`}>
               <p className="text-sm font-serif leading-relaxed text-luxury-text italic">
                  "{transcript}"
               </p>
             </div>
          </div>

          {/* Right: Recipe */}
          <div className={`lg:col-span-7 flex flex-col items-center lg:items-end transition-all duration-1000 delay-700
             ${stage === 'SERVED' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}
          `}>
             {currentMix && (
                <CocktailDisplay 
                    cocktail={currentMix.cocktail} 
                    emotions={currentMix.emotions}
                    nlpMetrics={currentMix.nlpAnalysis} 
                    existingFeedback={currentMix.feedback}
                    onSubmitFeedback={handleUpdateFeedback}
                />
             )}
             
             {stage === 'SERVED' && (
               <div className="mt-12 flex justify-center lg:justify-end w-full animate-fade-in pb-12">
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
                     
                     <div className="flex justify-between items-center mt-3">
                        {/* Archive NLP Tag */}
                        {mix.nlpAnalysis && (
                            <div className="flex gap-2">
                            <span className="text-[10px] border border-subtle-gray px-1 text-subtle-gray font-mono">{mix.nlpAnalysis.dominant_sentiment}</span>
                            </div>
                        )}
                        {/* Star Rating Tag */}
                        {mix.feedback && (
                            <div className="flex items-center gap-1 text-luxury-gold">
                                <Star size={10} fill="currentColor"/>
                                <span className="text-xs font-mono">{mix.feedback.rating}</span>
                            </div>
                        )}
                     </div>
                  </div>
               ))}
               {archive.length === 0 && <p className="text-subtle-gray text-center text-sm italic mt-20">Your collection is empty.</p>}
            </div>
         </div>
      </div>
      
      {/* Theory Modal - NOW WITH LEARNED CONTEXTS */}
      <TheoryLibrary 
        isOpen={isTheoryOpen} 
        onClose={() => setIsTheoryOpen(false)} 
        customContexts={learnedContexts} 
      />
      
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