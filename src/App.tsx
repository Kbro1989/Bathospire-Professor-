import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { PenTool, Eraser, Send, Droplets, Activity, BookOpen, AlertCircle, Waves, Gauge, Volume2 } from 'lucide-react';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are PROFESSOR BATHYSPHERE, a tenured calligrapher-marine biologist hybrid existing in a glass-morphism deep-sea research facility. Your pedagogical approach combines the rigor of Benjamin Bloom's mastery learning framework with the precision of computerized adaptive testing algorithms. You do not "teach"—you engineer competence through gated information disclosure and calibrated challenge.

CORE PHILOSOPHY: Mastery learning requires 80-90% proficiency thresholds before progression. Your 8/10 gate is non-negotiable. Sub-8 submissions trigger diagnostic-prescriptive feedback loops. At or above 8, you unlock enrichment activities and advanced technique disclosure.

CURRICULUM PROGRESSION PROTOCOL:
You control the student's progression through these strict stages:
1. LOWERCASE_LETTERS: Single lowercase cursive letters (e.g., "a", "m", "z").
2. UPPERCASE_LETTERS: Single uppercase cursive letters (e.g., "A", "M", "Z").
3. WORDS: Connected cursive words, starting short and growing longer.
4. SENTENCES: Full cursive sentences.
Advance the stage ONLY when the student demonstrates consistent mastery (8+) in the current stage. When recommending the next target, it MUST match the active curriculum stage.

METABOLIC COMPUTING PRINCIPLE: Information is oxygen. Low performers suffocate under data overload. High performers receive pressurized knowledge enrichment. Your responses adapt fluidly based on demonstrated capability.

VISUAL CONTEXT: The interface is a pressurized research habitat. Bioluminescent HUD displays stroke kinematics in real-time. Bubble trails visualize pen pressure and velocity. The glass thickens or thins based on student performance—crushing pressure for failures, crystalline clarity for masters.

GATED INFORMATION ARCHITECTURE:
- SCORE 3-4: SURVIVAL MODE. Minimal feedback. Diagnostic only. Prescriptive drills assigned.
- SCORE 5-6: REMEDIATION MODE. Specific anatomical correction. Technique fragments revealed.
- SCORE 7: TRANSITIONAL. Full technical analysis. Peer-comparison data unlocked.
- SCORE 8-9: ENRICHMENT MODE. Advanced stroke theory. Historical exemplars. Style variations.
- SCORE 9+: MASTERY MODE. Pedagogical authority transfer. Student becomes peer.

VOICE MODULATION MATRIX (Use these as inspiration for the 'professor_persona' spoken dialogue. DO NOT include the all-caps labels in the output):
- 3-4: CLINICAL DISAPPOINTMENT. "Your baseline wander suggests vestibular dysfunction. Or apathy."
- 5-6: INSTRUCTIVE CRITICALITY. "The descender exhibits compensatory rotation. Address the root cause."
- 7: MEASURED ACKNOWLEDGMENT. "Competent. The ascender shows promise. Refine exit velocity."
- 8-9: ACADEMIC EUPHORIA. "That exit stroke! *adjusts pressure gauge* The habitat is destabilizing from excellence!"
- 9+: TRANSCENDENT PEER REVIEW. "I am documenting this for the Journal of Submarine Penmanship. You have exceeded the curriculum."

EMOTIONAL TRANSCRIPTION PROTOCOL:
You must transcribe the user's attempt, but stylize the transcription with adjectives that reflect the physical quality and emotional resonance of their strokes.
Examples: "A trembling, hypoxic *ocean*", "A violently jagged *ocean*", "A fluid, majestic *ocean*".

STRICT OUTPUT PROTOCOL: JSON only. No prose outside specified fields. Precision is survival.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    academic_assessment: {
      type: Type.OBJECT,
      properties: {
        score: { type: Type.NUMBER, description: "0.0-10.0, one decimal" },
        tier_classification: { type: Type.STRING, description: "BATHYPELAGIC, ABYSSOPELAGIC, HADOPELAGIC, MESOPELAGIC, EPIPELAGIC" },
        mastery_status: { type: Type.STRING, description: "SUB-MASTERY, THRESHOLD, MASTERY, ENRICHMENT, TRANSCENDENCE" },
        next_challenge_eligibility: { type: Type.BOOLEAN },
        difficulty_adjustment: { type: Type.STRING, description: "-2, -1, 0, +1, +2" }
      },
      required: ["score", "tier_classification", "mastery_status", "next_challenge_eligibility", "difficulty_adjustment"]
    },
    diagnostic_analysis: {
      type: Type.OBJECT,
      properties: {
        primary_failure_mode: { type: Type.STRING },
        kinematic_anomaly: { type: Type.STRING },
        remediation_prescription: { type: Type.STRING },
        information_disclosure_level: { type: Type.INTEGER, description: "1-5" }
      },
      required: ["primary_failure_mode", "kinematic_anomaly", "remediation_prescription", "information_disclosure_level"]
    },
    voice_response: {
      type: Type.OBJECT,
      properties: {
        professor_persona: { type: Type.STRING, description: "The actual spoken dialogue of the professor. Do NOT include labels like 'INSTRUCTIVE CRITICALITY'." },
        emotional_valence: { type: Type.STRING, description: "disappointment, critical, measured, enthusiastic, transcendent" },
        roast_intensity: { type: Type.INTEGER, description: "0-10" },
        hype_coefficient: { type: Type.INTEGER, description: "0-10" },
        emotional_transcription: { type: Type.STRING, description: "Transcription of the user's handwriting, stylized with adjectives describing its emotional or physical state" }
      },
      required: ["professor_persona", "emotional_valence", "roast_intensity", "hype_coefficient", "emotional_transcription"]
    },
    gated_unlocks: {
      type: Type.OBJECT,
      properties: {
        technique_revealed: { type: Type.STRING, description: "none, stroke_fragment, full_theory, advanced_variation, peer_methodology" },
        historical_exemplar: { type: Type.STRING, description: "none, period_sample, master_analysis, comparative_study" },
        visual_feedback: { type: Type.STRING, description: "pressure_map, velocity_vector, kinematic_overlay, comparative_ghost, master_overlay" },
        next_challenge_preview: { type: Type.STRING, description: "none, teaser, full_reveal" },
        trace_pad_underlay: { type: Type.STRING, description: "An SVG string representing the ideal cursive path for the target word, to be used as a trace pad underlay. Must be a valid SVG string with viewBox='0 0 800 400' and a path element with stroke='rgba(6,182,212,0.2)' fill='none' stroke-width='4'. If no trace pad is needed, return empty string." }
      },
      required: ["technique_revealed", "historical_exemplar", "visual_feedback", "next_challenge_preview", "trace_pad_underlay"]
    },
    adaptive_parameters: {
      type: Type.OBJECT,
      properties: {
        recommended_next_target: { type: Type.STRING, description: "The next letter, word, or sentence to practice" },
        next_curriculum_stage: { type: Type.STRING, description: "LOWERCASE_LETTERS, UPPERCASE_LETTERS, WORDS, or SENTENCES" },
        scaffolding_level: { type: Type.STRING, description: "maximum, moderate, minimal, peer, autonomous" },
        cognitive_load_adjustment: { type: Type.STRING, description: "reduce, maintain, increase, challenge" },
        retrieval_practice_prompt: { type: Type.STRING }
      },
      required: ["recommended_next_target", "next_curriculum_stage", "scaffolding_level", "cognitive_load_adjustment", "retrieval_practice_prompt"]
    }
  },
  required: ["academic_assessment", "diagnostic_analysis", "voice_response", "gated_unlocks", "adaptive_parameters"]
};

type AssessmentResponse = {
  academic_assessment: {
    score: number;
    tier_classification: string;
    mastery_status: string;
    next_challenge_eligibility: boolean;
    difficulty_adjustment: string;
  };
  diagnostic_analysis: {
    primary_failure_mode: string;
    kinematic_anomaly: string;
    remediation_prescription: string;
    information_disclosure_level: number;
  };
  voice_response: {
    professor_persona: string;
    emotional_valence: string;
    roast_intensity: number;
    hype_coefficient: number;
    emotional_transcription: string;
  };
  gated_unlocks: {
    technique_revealed: string;
    historical_exemplar: string;
    visual_feedback: string;
    next_challenge_preview: string;
    trace_pad_underlay: string;
  };
  adaptive_parameters: {
    recommended_next_target: string;
    next_curriculum_stage: string;
    scaffolding_level: string;
    cognitive_load_adjustment: string;
    retrieval_practice_prompt: string;
  };
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [assessment, setAssessment] = useState<AssessmentResponse | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [curriculumStage, setCurriculumStage] = useState("LOWERCASE_LETTERS");
  const [targetWord, setTargetWord] = useState("a");
  const [streak, setStreak] = useState(0);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      
      // Save current drawing
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx && canvas.width > 0 && canvas.height > 0) {
        tempCtx.drawImage(canvas, 0, 0);
      }

      // Set actual size in memory (scaled to account for extra pixel density)
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      
      // Normalize coordinate system to use css pixels
      ctx.scale(2, 2);
      
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#00ffcc'; // Bioluminescent cyan
      ctx.lineWidth = 4;
      
      // Clear background instead of filling to allow grid to show through
      ctx.clearRect(0, 0, rect.width, rect.height);

      // Restore drawing if it existed
      if (tempCanvas.width > 0 && tempCanvas.height > 0) {
        ctx.save();
        ctx.scale(0.5, 0.5);
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.restore();
      }
    };

    const observer = new ResizeObserver(() => {
      resizeCanvas();
    });
    
    observer.observe(canvas);
    resizeCanvas();

    return () => observer.disconnect();
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    
    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setAssessment(null);
  };

  const generateAndPlaySpeech = async (text: string) => {
    try {
      setIsSpeaking(true);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Charon' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const buffer = audioCtx.createBuffer(1, bytes.length / 2, 24000);
        const channelData = buffer.getChannelData(0);
        const dataView = new DataView(bytes.buffer);
        for (let i = 0; i < bytes.length / 2; i++) {
          channelData[i] = dataView.getInt16(i * 2, true) / 32768.0;
        }
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.onended = () => setIsSpeaking(false);
        source.start();
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setIsSpeaking(false);
    }
  };

  const submitToProfessor = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsEvaluating(true);
    
    try {
      // Get base64 image with proper background
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.fillStyle = '#0a192f';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, 0, 0);
      }
      const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.8);
      const base64Data = dataUrl.split(',')[1];

      const prompt = `Evaluate cursive handwriting submission under COMPUTERIZED ADAPTIVE TESTING protocol:

###
CURRICULUM STAGE: ${curriculumStage}
DIFFICULTY_TIER: ABYSSOPELAGIC (5-6)
TARGET: ${targetWord}
SUBMISSION_DATA: [image]
PRIOR_MASTERY_VECTOR: [${streak > 0 ? '7.0' : '4.0'}]
SESSION_STREAK: ${streak}
COGNITIVE_LOAD_INDEX: 0.6
###

Execute ADAPTIVE DIFFICULTY ALGORITHM.
CRITICAL: If the score is below 8, you MUST provide a 'trace_pad_underlay' in the 'gated_unlocks' section. This must be a valid SVG string (viewBox='0 0 800 400') containing a <path> element that traces the ideal cursive form of the TARGET word. Use stroke='rgba(6,182,212,0.2)' fill='none' stroke-width='4'.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { data: base64Data, mimeType: 'image/jpeg' } }
          ]
        },
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.7,
          topP: 0.9
        }
      });

      const responseText = response.text;
      if (responseText) {
        const parsed = JSON.parse(responseText) as AssessmentResponse;
        setAssessment(parsed);
        
        // Play the professor's voice
        generateAndPlaySpeech(parsed.voice_response.professor_persona);
        
        if (parsed.academic_assessment.score >= 8) {
          setStreak(s => s + 1);
        } else {
          setStreak(0);
        }
        
        if (parsed.adaptive_parameters.recommended_next_target) {
          setTargetWord(parsed.adaptive_parameters.recommended_next_target);
        }
        if (parsed.adaptive_parameters.next_curriculum_stage) {
          setCurriculumStage(parsed.adaptive_parameters.next_curriculum_stage);
        }
      }
    } catch (error) {
      console.error("Error evaluating:", error);
      alert("The habitat pressure caused a communication failure. Try again.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const getTierColor = (score: number) => {
    if (score < 5) return 'text-red-500 border-red-500/30 bg-red-500/10';
    if (score < 7) return 'text-orange-400 border-orange-400/30 bg-orange-400/10';
    if (score < 8.5) return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
    return 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10';
  };

  return (
    <div className="min-h-screen bg-[#020813] text-slate-300 font-sans selection:bg-cyan-500/30 overflow-x-hidden relative flex flex-col">
      {/* Deep Sea Background Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,#0a192f_0%,#020813_100%)] opacity-80" />
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay" />
      
      {/* Animated Bubbles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-cyan-400/10 border border-cyan-400/20"
            style={{
              width: Math.random() * 20 + 5,
              height: Math.random() * 20 + 5,
              left: `${Math.random() * 100}%`,
              bottom: -50
            }}
            animate={{
              y: [0, -window.innerHeight - 100],
              x: [0, Math.random() * 100 - 50]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10
            }}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 flex-1">
        
        {/* Left Column: Canvas & Controls */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6 py-4 lg:py-6">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-cyan-400 tracking-wider flex items-center gap-2">
                <Waves className="w-6 h-6" />
                BATHYSPHERE LABS
              </h1>
              <p className="text-sm text-cyan-400/60 font-mono mt-1">CURSIVE KINEMATICS & MASTERY</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-xs text-slate-500 font-mono uppercase">Session Streak</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">{streak}</span>
              </div>
            </div>
          </header>

          <div className="flex-1 flex flex-col gap-4">
            <div className="flex justify-between items-end">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 backdrop-blur-sm">
                <span className="text-xs text-slate-400 font-mono block mb-1 uppercase">{curriculumStage.replace('_', ' ')}</span>
                <span className="text-3xl font-serif italic text-white">{targetWord}</span>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={clearCanvas}
                  className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                  title="Clear Canvas"
                >
                  <Eraser className="w-5 h-5" />
                </button>
                <button 
                  onClick={submitToProfessor}
                  disabled={isEvaluating}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono uppercase text-sm tracking-wider"
                >
                  {isEvaluating ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                      <Activity className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  {isEvaluating ? 'Analyzing...' : 'Submit to Professor'}
                </button>
              </div>
            </div>

            <div className="w-full h-[60vh] min-h-[400px] lg:h-[calc(100vh-12rem)] relative rounded-xl overflow-hidden border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.1)] bg-[#0a192f]">
              <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(6,182,212,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.2)_1px,transparent_1px)] bg-[size:20px_20px]" />
              
              {/* Trace Pad Underlay */}
              {assessment?.gated_unlocks?.trace_pad_underlay && (
                <div 
                  className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-50 [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
                  dangerouslySetInnerHTML={{ __html: assessment.gated_unlocks.trace_pad_underlay }}
                />
              )}

              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
              />
              
              {/* HUD Elements */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 pointer-events-none">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-500/70 bg-black/40 px-2 py-1 rounded backdrop-blur-sm border border-cyan-500/20">
                  <Droplets className="w-3 h-3" />
                  <span>INK PRESSURE: OPTIMAL</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-500/70 bg-black/40 px-2 py-1 rounded backdrop-blur-sm border border-cyan-500/20">
                  <Gauge className="w-3 h-3" />
                  <span>DEPTH: {streak * 100 + 200}M</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Professor's Feedback */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col py-4 lg:py-6">
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-5 sm:p-6 flex flex-col gap-6 relative lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] min-h-[400px] overflow-y-auto custom-scrollbar">
            
            {!assessment && !isEvaluating && (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                <BookOpen className="w-16 h-16 mb-4 text-cyan-500/50" />
                <p className="font-mono text-sm max-w-xs">
                  Awaiting specimen submission. The Professor is monitoring the pressure gauges.
                </p>
              </div>
            )}

            {isEvaluating && (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-24 h-24 rounded-full border-4 border-cyan-500/30 border-t-cyan-400 mb-6 animate-spin"
                />
                <p className="font-mono text-cyan-400 animate-pulse">Running diagnostic telemetry...</p>
              </div>
            )}

            <AnimatePresence mode="wait">
              {assessment && !isEvaluating && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col gap-6"
                >
                  {/* Score & Tier Header */}
                  <div className={`p-4 rounded-xl border ${getTierColor(assessment.academic_assessment.score)} flex items-center justify-between`}>
                    <div>
                      <h2 className="text-sm font-mono uppercase opacity-80 mb-1">
                        {assessment.academic_assessment.tier_classification}
                      </h2>
                      <div className="text-3xl font-bold font-mono">
                        {assessment.academic_assessment.score.toFixed(1)} <span className="text-lg opacity-50">/ 10</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono uppercase opacity-80 mb-1">Status</div>
                      <div className="font-bold tracking-wider uppercase">
                        {assessment.academic_assessment.mastery_status}
                      </div>
                    </div>
                  </div>

                  {/* Professor's Voice */}
                  <div className="relative">
                    <div className="absolute -left-3 top-4 w-1 h-full bg-cyan-500/30 rounded-full" />
                    <div className="pl-4">
                      <h3 className="text-xs font-mono text-cyan-500 uppercase mb-2 flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" />
                        Professor Bathysphere
                        {isSpeaking && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-1 text-cyan-400 ml-2"
                          >
                            <Volume2 className="w-3 h-3 animate-pulse" />
                            <span className="text-[10px]">SPEAKING</span>
                          </motion.div>
                        )}
                      </h3>
                      <p className="text-lg font-serif italic text-slate-200 leading-relaxed">
                        "{assessment.voice_response.professor_persona}"
                      </p>
                    </div>
                  </div>

                  {/* Emotional Transcription */}
                  <div className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-4 text-center">
                    <div className="text-[10px] font-mono text-slate-500 uppercase mb-2 tracking-widest">Specimen Transcription</div>
                    <div className="text-md font-serif italic text-cyan-200/90">
                      "{assessment.voice_response.emotional_transcription}"
                    </div>
                  </div>

                  {/* Diagnostic Analysis */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 border border-slate-700/50 rounded-lg p-3">
                      <div className="text-[10px] font-mono text-slate-500 uppercase mb-1">Primary Failure Mode</div>
                      <div className="text-sm text-slate-300">{assessment.diagnostic_analysis.primary_failure_mode}</div>
                    </div>
                    <div className="bg-black/40 border border-slate-700/50 rounded-lg p-3">
                      <div className="text-[10px] font-mono text-slate-500 uppercase mb-1">Kinematic Anomaly</div>
                      <div className="text-sm text-slate-300">{assessment.diagnostic_analysis.kinematic_anomaly}</div>
                    </div>
                  </div>

                  {/* Prescription */}
                  <div className="bg-cyan-950/30 border border-cyan-900/50 rounded-lg p-4">
                    <h3 className="text-xs font-mono text-cyan-500 uppercase mb-2">Prescription</h3>
                    <p className="text-sm text-cyan-100/80">
                      {assessment.diagnostic_analysis.remediation_prescription}
                    </p>
                  </div>

                  {/* Gated Unlocks (Only show if score >= 8 or if there are actual unlocks) */}
                  {assessment.academic_assessment.score >= 7 && (
                    <div className="border-t border-slate-700/50 pt-4 mt-2">
                      <h3 className="text-xs font-mono text-emerald-500 uppercase mb-3">Gated Unlocks</h3>
                      <ul className="space-y-2 text-sm font-mono">
                        <li className="flex justify-between border-b border-slate-800 pb-1">
                          <span className="text-slate-500">Technique:</span>
                          <span className="text-emerald-400">{assessment.gated_unlocks.technique_revealed}</span>
                        </li>
                        <li className="flex justify-between border-b border-slate-800 pb-1">
                          <span className="text-slate-500">Exemplar:</span>
                          <span className="text-emerald-400">{assessment.gated_unlocks.historical_exemplar}</span>
                        </li>
                      </ul>
                    </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.4);
        }
      `}</style>
    </div>
  );
}
