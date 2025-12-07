import React, { useState, useMemo } from 'react';
import { X, BrainCircuit, Activity, Beaker, Scale, Dna, Network, BookOpen, Quote, ChevronDown, ChevronRight, Tag, User } from 'lucide-react';
import { LearnedContext } from '../types';

interface TheoryLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  customContexts?: LearnedContext[];
}

const TheoryLibrary: React.FC<TheoryLibraryProps> = ({ isOpen, onClose, customContexts = [] }) => {
  const [activeTab, setActiveTab] = useState<'neurogastronomy' | 'linguistics' | 'mechanics'>('neurogastronomy');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const neuroTheories = [
    {
      title: "Crossmodal Correspondences",
      subtitle: "Auditory-Gustatory Mapping",
      icon: <BrainCircuit size={20} />,
      content: "Research by Prof. Charles Spence (Oxford) demonstrates that humans consistently map 'low-pitched' sounds and sombre emotions to bitter/woody flavors, while 'high-pitched', fast-tempo inputs map to sweet/acidic flavors.",
      application: "We utilize this to map 'Melancholy' (Low Arousal/Negative Valence) to molecularly heavy compounds found in aged Whisky (Tannins/Lignin).",
      citation: "Spence, C. (2011). Crossmodal correspondences: A tutorial review."
    },
  ];

  // Base Matrix
  const baseMatrix = [
    {
      emotion: "Joy",
      chemical_base: "Dopamine",
      base_pump: "Soda (Effervescence)",
      contexts: [
        {
          tag: "Social / Celebration",
          modifier: "Max Carbonation + Fruit",
          reason: "Mimics the chaos and bubbling energy of social laughter."
        },
        {
          tag: "Intimacy / Contentment",
          modifier: "High Sucrose (Sweet)",
          reason: "Sugar triggers primal safety/warmth signals (breastmilk mimicry)."
        }
      ]
    },
    {
      emotion: "Melancholy",
      chemical_base: "Serotonin (Low)",
      base_pump: "Whisky (Wood/Age)",
      contexts: [
        {
          tag: "Heartbreak / Grief",
          modifier: "High Alkaloids (Bitter)",
          reason: "Astringency creates a grounding effect; toxicity signal slows ingestion."
        },
        {
          tag: "Nostalgia / Reflection",
          modifier: "Sweet + Oak",
          reason: "Aged vanillins trigger memory centers in the hippocampus (Proust Effect)."
        }
      ]
    },
    {
      emotion: "Stress",
      chemical_base: "Cortisol",
      base_pump: "Variable",
      contexts: [
        {
          tag: "Work / Burnout",
          modifier: "High Acid (Sour)",
          reason: "Trigeminal nerve stimulation forces a physiological 'System Reset'."
        },
        {
          tag: "Anxiety / Fear",
          modifier: "High Ethanol (Vodka)",
          reason: "Utilizes alcohol's GABAergic properties for sedation/calming."
        }
      ]
    },
    {
      emotion: "Energy",
      chemical_base: "Adrenaline",
      base_pump: "Vodka (Fuel)",
      contexts: [
        {
          tag: "Anger / Conflict",
          modifier: "Acid + Bitter",
          reason: "Harsh, clashing inputs mirror internal dissonance and heat."
        },
        {
          tag: "Motivation / Excitement",
          modifier: "Sugar + Ethanol",
          reason: "Rapid caloric uptake provides immediate physiological fuel."
        }
      ]
    },
    {
      emotion: "Mystery",
      chemical_base: "Acetylcholine",
      base_pump: "Complex (Split Base)",
      contexts: [
        {
          tag: "Confusion / Chaos",
          modifier: "Cloudy (Fruit + Soda)",
          reason: "Visual turbidity and masked flavors reflect cognitive ambiguity."
        },
        {
          tag: "Curiosity / Discovery",
          modifier: "Herbal (Bitter + Fruit)",
          reason: "Complex flavor profiles force the brain to analyze and decipher."
        }
      ]
    }
  ];

  // Merge Custom Contexts into Base Matrix
  const mergedMatrix = useMemo(() => {
    return baseMatrix.map(category => {
        // Find custom contexts that match this emotion
        const relevantCustoms = customContexts.filter(c => c.emotion === category.emotion).map(c => ({
            tag: c.tag,
            modifier: c.modifier,
            reason: c.reason,
            isUserDerived: true // Flag to render differently
        }));

        return {
            ...category,
            contexts: [...category.contexts, ...relevantCustoms]
        };
    });
  }, [customContexts]);

  const inventory = [
    { id: 1, type: "Modifier", name: "Acid (Sour)", detail: "Citric/Malic Solution", pin: 3 },
    { id: 2, type: "Modifier", name: "Sweet", detail: "Rich Simple Syrup (2:1)", pin: 5 },
    { id: 3, type: "Modifier", name: "Bitter", detail: "Aromatic Bitters/Amaro", pin: 6 },
    { id: 4, type: "Modifier", name: "Fruit", detail: "Esters/Aldehydes", pin: 9 },
    { id: 5, type: "Base", name: "Vodka", detail: "Neutral Grain Spirit", pin: 10 },
    { id: 6, type: "Base", name: "Whisky", detail: "Oak-Aged Spirit", pin: 11 },
    { id: 7, type: "Mixer", name: "Soda", detail: "H2O + CO2", pin: 12 },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-luxury-gray w-full max-w-6xl h-[90vh] flex flex-col rounded-sm relative animate-slide-up shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#0a0a0a] border-b border-luxury-gray p-8 flex justify-between items-start flex-shrink-0">
          <div>
            <h2 className="text-3xl font-serif text-luxury-text mb-2">Theoretical Framework</h2>
            <div className="flex items-center gap-3">
                <span className="text-xs text-luxury-gold uppercase tracking-widest font-mono border border-luxury-gold/30 px-2 py-0.5">
                    Mnemonic Mixology v2.3
                </span>
                <span className="text-xs text-subtle-gray font-serif italic">
                    Self-Correcting Heuristic Engine
                </span>
            </div>
          </div>
          <button onClick={onClose} className="text-subtle-gray hover:text-white transition-colors">
            <X size={24} strokeWidth={1} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-luxury-gray bg-[#0f0f0f] flex-shrink-0 overflow-x-auto">
            <button 
                onClick={() => setActiveTab('neurogastronomy')}
                className={`flex-1 min-w-[200px] py-5 text-xs uppercase tracking-[0.2em] transition-all relative
                    ${activeTab === 'neurogastronomy' ? 'text-white bg-white/5' : 'text-subtle-gray hover:text-white hover:bg-white/5'}
                `}
            >
                <div className="flex items-center justify-center gap-2">
                    <BrainCircuit size={14} className={activeTab === 'neurogastronomy' ? 'text-luxury-gold' : ''} />
                    Neuro-Logic Matrix
                </div>
                {activeTab === 'neurogastronomy' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-luxury-gold"></div>}
            </button>

            <button 
                onClick={() => setActiveTab('linguistics')}
                className={`flex-1 min-w-[200px] py-5 text-xs uppercase tracking-[0.2em] transition-all relative
                    ${activeTab === 'linguistics' ? 'text-white bg-white/5' : 'text-subtle-gray hover:text-white hover:bg-white/5'}
                `}
            >
                <div className="flex items-center justify-center gap-2">
                    <Network size={14} className={activeTab === 'linguistics' ? 'text-luxury-gold' : ''} />
                    Computational NLP
                </div>
                {activeTab === 'linguistics' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-luxury-gold"></div>}
            </button>

            <button 
                onClick={() => setActiveTab('mechanics')}
                className={`flex-1 min-w-[200px] py-5 text-xs uppercase tracking-[0.2em] transition-all relative
                    ${activeTab === 'mechanics' ? 'text-white bg-white/5' : 'text-subtle-gray hover:text-white hover:bg-white/5'}
                `}
            >
                <div className="flex items-center justify-center gap-2">
                    <Scale size={14} className={activeTab === 'mechanics' ? 'text-luxury-gold' : ''} />
                    Fluid Mechanics
                </div>
                {activeTab === 'mechanics' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-luxury-gold"></div>}
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
          
          {/* TAB 1: NEUROGASTRONOMY (THE MATRIX) */}
          {activeTab === 'neurogastronomy' && (
             <div className="space-y-12 animate-fade-in max-w-5xl mx-auto">
                
                <div className="relative pl-8 border-l-2 border-luxury-gold/50 mb-12">
                    <Quote size={24} className="absolute -left-3 -top-3 text-luxury-black bg-luxury-gold p-1 rounded-full" fill="currentColor" />
                    <p className="text-xl font-serif text-gray-300 italic leading-relaxed">
                        "The algorithm learns. Each feedback loop refines the vector space, creating a living archive of human emotional-gustatory mappings."
                    </p>
                </div>

                {/* The New Matrix Table */}
                <div>
                    <h3 className="text-sm uppercase tracking-[0.2em] text-subtle-gray mb-6 flex items-center gap-2">
                        <Activity size={16} /> Psycho-Gustatory Translation Matrix
                    </h3>
                    
                    <div className="bg-[#111] border border-luxury-gray rounded-sm overflow-hidden">
                        <div className="grid grid-cols-12 bg-white/5 border-b border-luxury-gray text-xs font-mono uppercase text-subtle-gray tracking-wider">
                            <div className="col-span-3 p-4">Primary Vector</div>
                            <div className="col-span-3 p-4">Base Substrate</div>
                            <div className="col-span-6 p-4">Contextual Modifiers (Layer 2)</div>
                        </div>

                        {mergedMatrix.map((item, idx) => (
                            <div key={idx} className="border-b border-luxury-gray/30 last:border-0 hover:bg-white/5 transition-colors">
                                <div className="grid grid-cols-12">
                                    {/* Primary Vector (Emotion) */}
                                    <div 
                                        className="col-span-3 p-6 flex flex-col justify-center border-r border-luxury-gray/10 cursor-pointer"
                                        onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                                    >
                                        <div className="flex items-center gap-2 text-luxury-gold font-serif text-lg">
                                            {item.emotion}
                                            {expandedRow === idx ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                                        </div>
                                        <span className="text-[10px] text-subtle-gray uppercase tracking-widest mt-1">
                                            Target: {item.chemical_base}
                                        </span>
                                    </div>

                                    {/* Base Substrate */}
                                    <div className="col-span-3 p-6 flex items-center text-sm text-gray-300 border-r border-luxury-gray/10 font-mono">
                                        {item.base_pump}
                                    </div>

                                    {/* Contexts */}
                                    <div className="col-span-6 p-0">
                                        {item.contexts.map((ctx: any, cIdx: number) => (
                                            <div key={cIdx} className={`p-4 border-b border-luxury-gray/10 last:border-0 flex gap-4 ${ctx.isUserDerived ? 'bg-cyan-900/10' : ''}`}>
                                                <div className="w-1/3 shrink-0">
                                                    <div className={`flex items-center gap-1.5 text-xs uppercase tracking-wider mb-1 ${ctx.isUserDerived ? 'text-cyan-400' : 'text-white'}`}>
                                                        {ctx.isUserDerived ? <User size={10} /> : <Tag size={10} className="text-luxury-gold" />}
                                                        {ctx.tag}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 font-mono">
                                                        → {ctx.modifier}
                                                    </div>
                                                </div>
                                                <div className={`text-xs italic leading-snug border-l pl-4 flex-1 flex flex-col justify-center
                                                    ${ctx.isUserDerived ? 'text-cyan-100/60 border-cyan-500/20' : 'text-gray-400 border-luxury-gray/10'}`}>
                                                    "{ctx.reason}"
                                                    {ctx.isUserDerived && <span className="block text-[8px] text-cyan-500 uppercase tracking-widest mt-1 not-italic font-mono">Empirical Data</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 mt-12">
                    {neuroTheories.map((t, idx) => (
                        <div key={idx} className="bg-[#111] border border-luxury-gray p-6 rounded-sm flex items-start gap-4 opacity-70 hover:opacity-100 transition-opacity">
                            <div className="p-2 bg-luxury-gray/50 rounded-full text-luxury-gold shrink-0">
                                {t.icon}
                            </div>
                            <div>
                                <h3 className="text-sm text-white font-serif mb-1">{t.title}</h3>
                                <p className="text-[10px] text-gray-400 leading-relaxed">{t.content}</p>
                            </div>
                        </div>
                    ))}
                </div>

             </div>
          )}

          {/* TAB 2: LINGUISTICS */}
          {activeTab === 'linguistics' && (
              <div className="space-y-12 animate-fade-in max-w-4xl mx-auto">
                  
                  <div className="bg-[#111] border border-luxury-gray p-8 rounded-sm">
                      <div className="flex flex-col md:flex-row gap-8 items-center">
                          <div className="flex-1">
                              <h3 className="text-xl font-serif text-white mb-4">Vector Space Modeling</h3>
                              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                                  We simulate a Transformer-based sentiment analysis model. 
                                  User speech is converted to high-dimensional vectors, extracting both <strong>primary sentiment</strong> and <strong>secondary themes</strong>.
                              </p>
                              <div className="font-mono text-xs text-luxury-gold p-4 bg-black border border-luxury-gray/50 rounded">
                                  Input: "I am stressed about my deadline."<br/>
                                  Vector 1 (Emotion): Stress [0.89]<br/>
                                  Vector 2 (Theme): Work/Deadline -> Triggers "Wake Up" Protocol
                              </div>
                          </div>
                          <div className="w-full md:w-1/3 aspect-square relative bg-black rounded-full border border-luxury-gray flex items-center justify-center">
                              <div className="absolute inset-2 border border-dashed border-luxury-gray/30 rounded-full animate-spin-slow"></div>
                              <div className="text-center">
                                  <span className="block text-2xl font-serif text-white">NLP</span>
                                  <span className="block text-[10px] text-subtle-gray uppercase tracking-widest mt-1">Engine</span>
                              </div>
                              {/* Decor elements */}
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0a0a0a] px-2 text-[9px] text-subtle-gray">SENTIMENT</div>
                              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 bg-[#0a0a0a] px-2 text-[9px] text-subtle-gray">CONTEXT</div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* TAB 3: MECHANICS */}
          {activeTab === 'mechanics' && (
              <div className="space-y-12 animate-fade-in max-w-4xl mx-auto">
                  
                  {/* Scalar Logic Section */}
                  <section>
                      <div className="flex items-center gap-3 mb-6 text-luxury-gold">
                          <Scale size={18} />
                          <h3 className="text-sm uppercase tracking-[0.2em]">Volumetric Algorithms (320ml Standard)</h3>
                      </div>
                      
                      <div className="bg-white/5 border border-luxury-gray rounded-sm overflow-hidden mb-6">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-luxury-gray bg-white/5">
                                    <th className="p-4 text-xs font-mono uppercase text-subtle-gray w-1/4">Role</th>
                                    <th className="p-4 text-xs font-mono uppercase text-subtle-gray w-1/4">Pump Index</th>
                                    <th className="p-4 text-xs font-mono uppercase text-subtle-gray w-1/4">Target Vol</th>
                                    <th className="p-4 text-xs font-mono uppercase text-subtle-gray">Flow Dynamic</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-luxury-gray/30">
                                    <td className="p-4 text-sm font-serif text-white">Base Spirit</td>
                                    <td className="p-4 text-xs font-mono text-gray-400">5, 6</td>
                                    <td className="p-4 text-xs font-mono text-luxury-gold">45ml - 60ml</td>
                                    <td className="p-4 text-xs text-gray-500 italic">High Flow (45ms/ml)</td>
                                </tr>
                                <tr className="border-b border-luxury-gray/30">
                                    <td className="p-4 text-sm font-serif text-white">Dilution / Body</td>
                                    <td className="p-4 text-xs font-mono text-gray-400">7 (Soda)</td>
                                    <td className="p-4 text-xs font-mono text-luxury-gold">150ml - 240ml</td>
                                    <td className="p-4 text-xs text-gray-500 italic">High Flow (45ms/ml)</td>
                                </tr>
                                <tr>
                                    <td className="p-4 text-sm font-serif text-white">Modifiers</td>
                                    <td className="p-4 text-xs font-mono text-gray-400">0 - 4</td>
                                    <td className="p-4 text-xs font-mono text-luxury-gold">5ml - 30ml</td>
                                    <td className="p-4 text-xs text-gray-500 italic">Precision Drip (600ms/ml)</td>
                                </tr>
                            </tbody>
                        </table>
                      </div>
                  </section>

                  {/* Inventory Section */}
                  <section>
                      <div className="flex items-center gap-3 mb-6 text-luxury-gold">
                          <Beaker size={18} />
                          <h3 className="text-sm uppercase tracking-[0.2em]">Hardware Allocation Map</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {inventory.map((item) => (
                              <div key={item.id} className="flex items-center justify-between border border-luxury-gray p-4 bg-black hover:border-white/20 transition-colors">
                                  <div className="flex items-center gap-4">
                                      <span className="w-6 h-6 rounded-full border border-luxury-gray flex items-center justify-center text-[10px] font-mono text-subtle-gray bg-white/5">
                                          {item.id}
                                      </span>
                                      <div>
                                          <span className="block text-sm text-white font-serif">{item.name}</span>
                                          <span className="text-[10px] uppercase tracking-wider text-subtle-gray">{item.type}</span>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-subtle-gray border border-white/10 px-1.5 py-0.5 rounded font-mono">
                                        PIN {item.pin}
                                      </span>
                                      <span className="text-xs text-luxury-gold font-mono border border-luxury-gold/20 px-2 py-1 bg-luxury-gold/5">
                                          {item.detail}
                                      </span>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </section>

              </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default TheoryLibrary;