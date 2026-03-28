import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PenTool,  Waves, 
  Send, 
  Eraser, 
  Activity, 
  BookOpen, 
  Volume2, 
  AlertCircle,
  MapPin,
  Droplets,
  Gauge,
  User,
  BookMarked,
  Skull,
  Smile
} from 'lucide-react';

// Professor persona and assessment logic moved to Cloudflare backend for security and Workers AI integration.

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
  audio?: string; // Base64 audio from Cloudflare backend
};

const CURRICULUM = [
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  'sea', 'kelp', 'reef', 'tide', 'pearl', 'abyss',
  'Hello Lab', 'Cursive Mastery', 'Professor Bathysphere'
];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [assessment, setAssessment] = useState<AssessmentResponse | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [curriculumIndex, setCurriculumIndex] = useState(0);
  const targetWord = CURRICULUM[curriculumIndex];
  const [streak, setStreak] = useState(0);
  const [backdropUrl, setBackdropUrl] = useState<string | null>(null);

  // Subject Profile & History
  const [ageRange, setAgeRange] = useState("Adult (18+)");
  const [educationalLevel, setEducationalLevel] = useState("Academic/Professional");
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [subjectId, setSubjectId] = useState<string>("");
  const [location, setLocation] = useState<{city: string, country: string} | null>(null);
  const [activeTab, setActiveTab] = useState<"lab" | "profile" | "records">("lab");
  const [harshness, setHarshness] = useState(50);
  
  // Kinematics Tracking
  const [currentStroke, setCurrentStroke] = useState<{u: number, v: number, t: number, p: number}[]>([]);
  const [allStrokes, setAllStrokes] = useState<{u: number, v: number, t: number, p: number}[][]>([]);
  const lastSampleTime = useRef(0);

  // Initialize Subject Identity
  useEffect(() => {
    let id = localStorage.getItem('bathosphere_subject_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('bathosphere_subject_id', id);
    }
    setSubjectId(id);

    const syncArchive = async () => {
      try {
        const res = await fetch(`/api/profile?subjectId=${id}`);
        if (res.ok) {
          const archive = await res.json();
          if (archive.scoreHistory) {
            setScoreHistory(archive.scoreHistory);
            if (archive.ageRange) setAgeRange(archive.ageRange);
            if (archive.educationalLevel) setEducationalLevel(archive.educationalLevel);
            if (archive.location) setLocation(archive.location);
          }
        }
      } catch (e) {
        console.error("Vault Synchronization Offline:", e);
      }
    };
    syncArchive();
  }, []);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx && canvas.width > 0 && canvas.height > 0) {
        tempCtx.drawImage(canvas, 0, 0);
      }

      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 4;
      ctx.clearRect(0, 0, rect.width, rect.height);

      if (tempCanvas.width > 0 && tempCanvas.height > 0) {
        ctx.save();
        ctx.scale(rect.width / (tempCanvas.width / 2), rect.height / (tempCanvas.height / 2));
        ctx.scale(0.5, 0.5);
        ctx.drawImage(tempCanvas, 0, 0);
        ctx.restore();
      }
    };

    const observer = new ResizeObserver(() => resizeCanvas());
    observer.observe(canvas.parentElement || document.body);
    resizeCanvas();
    return () => observer.disconnect();
  }, []);

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const p = e.pressure || 0.5;

    // Normalize coordinates
    const u = x / rect.width;
    const v = y / rect.height;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y);
    ctx.stroke();

    const point = { u, v, t: Date.now(), p };
    setCurrentStroke([point]);
    lastSampleTime.current = Date.now();
    
    ctx.lineWidth = 2 + (p * 8);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const p = e.pressure || 0.5;

    // Normalize coordinates
    const u = x / rect.width;
    const v = y / rect.height;

    ctx.lineWidth = 2 + (p * 8);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);

    const now = Date.now();
    if (now - lastSampleTime.current > 16) {
      setCurrentStroke(prev => [...prev, { u, v, t: now, p }]);
      lastSampleTime.current = now;
    }
  };

  const stopDrawing = () => {
    if (isDrawingRef.current) {
      setAllStrokes(prev => [...prev, currentStroke]);
      setCurrentStroke([]);
    }
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
    setAllStrokes([]);
  };

  const playBase64Audio = async (base64Audio: string) => {
    try {
      setIsSpeaking(true);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const buffer = await audioCtx.decodeAudioData(bytes.buffer);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.onended = () => setIsSpeaking(false);
      source.start();
    } catch (error) {
      console.error("Playback Error:", error);
      setIsSpeaking(false);
    }
  };

  const submitToProfessor = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsEvaluating(true);
    
    try {
      // --- CLINICAL INVERSION: Generate High-Contrast AI Snapshot ---
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        // AI models perform 30-40% better on Dark Text on Light Background (Ink-on-Paper logic)
        tempCtx.fillStyle = '#ffffff'; // White clinical paper
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Use Compositing to "Invert" the Neon Cyan ink into Black/Dark Grey
        tempCtx.globalCompositeOperation = 'difference';
        tempCtx.drawImage(canvas, 0, 0); // Cyan on White results in Red-Inversion
        
        // Second pass: Use 'grayscale' or 'source-in' to force Dark Specs
        tempCtx.globalCompositeOperation = 'destination-over';
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      }
      const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.7); // 70% quality is sufficient for vision
      const base64Data = dataUrl.split(',')[1];

      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Data,
          targetWord,
          streak,
          ageRange,
          educationalLevel,
          scoreHistory,
          subjectId,
          harshness,
          kinematics: allStrokes 
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Lab results compromised' }));
        throw new Error(errorData.error || 'Lab results compromised');
      }

      const parsed = await response.json() as AssessmentResponse & { location?: any };
      setAssessment(parsed);
      
      if (parsed.location) setLocation(parsed.location);

      const fullReport = `Assessment: ${parsed.academic_assessment.score.toFixed(1)}. Classification: ${parsed.academic_assessment.tier_classification}. Professor's Note: ${parsed.voice_response.professor_persona}. Diagnosis: ${parsed.diagnostic_analysis.primary_failure_mode}. Recommendation: ${parsed.diagnostic_analysis.remediation_prescription}`;

      if (parsed.audio) {
        playBase64Audio(parsed.audio);
      } else {
        const utterance = new SpeechSynthesisUtterance(fullReport);
        utterance.rate = 0.85;
        utterance.pitch = 0.75;
        window.speechSynthesis.speak(utterance);
      }
      
      // --- MASTERY GATE LOGIC ---
      const isMastered = parsed.academic_assessment.mastery_status === "Mastered" || parsed.academic_assessment.score >= 8.0;
      
      if (isMastered) {
        // Unlock Next Stage
        setCurriculumIndex(prev => (prev + 1) % CURRICULUM.length);
        setStreak(prev => prev + 1);
      } else {
        // Remediation / Hold Back
        setStreak(0);
      }

      setAssessment(parsed);
      setScoreHistory(prev => [parsed.academic_assessment.score, ...prev].slice(0, 10));

      // --- CHROMA BACKDROP CAPTURE ---
      if (parsed.gated_unlocks?.visual_feedback?.startsWith("data:image")) {
        setBackdropUrl(parsed.gated_unlocks.visual_feedback);
      }
    } catch (error: any) {
      console.error("Error evaluating:", error);
      alert(error.message || "Lab results compromised. Check telemetry.");
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

  const masteryIndex = scoreHistory.length > 0 
    ? (scoreHistory.reduce((a, b) => a + b, 0) / scoreHistory.length).toFixed(1) 
    : "0.0";

  return (
    <div className="h-screen w-screen bg-[#02050a] text-slate-300 font-sans selection:bg-cyan-500/30 overflow-hidden relative flex flex-col">
      {/* --- CHROMA BACKDROP LAYER --- */}
      {backdropUrl && (
        <div 
          className="absolute inset-0 z-0 transition-opacity duration-1000 animate-fade-in pointer-events-none"
          style={{
            backgroundImage: `url(${backdropUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: isEvaluating ? 0.1 : 0.25,
            filter: 'blur(20px) contrast(1.2) saturate(1.5)',
            mixBlendMode: 'screen'
          }}
        />
      )}

      {/* Background Depth Engine */}
      <motion.div 
        className="fixed inset-0 pointer-events-none"
        animate={{ 
          backgroundColor: parseFloat(masteryIndex) > 8 ? '#010307' : '#02050a',
          opacity: [0.7, 0.8, 0.7]
        }}
        transition={{ duration: 5, repeat: Infinity }}
      />
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-overlay pointer-events-none" />
      
      {/* Mobile-First Header */}
      <header className="relative z-50 px-4 py-3 flex items-center justify-between border-b border-cyan-500/10 bg-black/40 backdrop-blur-md">
        <h1 className="text-xl font-bold text-cyan-400 tracking-wider flex items-center gap-2">
          <Waves className="w-5 h-5" />
          BATHYSPHERE
        </h1>
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-slate-500 font-mono uppercase leading-none">Research Outpost</span>
          <span className="text-xs font-bold text-cyan-400 font-mono flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {location ? `${location.city}` : "SYNCING..."}
          </span>
        </div>
      </header>

      <main className="flex-1 relative flex overflow-hidden">
        
        {/* Left Column: Profile (Desktop Side or Mobile Tab) */}
        <aside className={`
          ${activeTab === 'profile' ? 'flex' : 'hidden'} 
          lg:flex lg:w-80 flex-col gap-6 p-6 border-r border-slate-800 bg-[#020813]/80 backdrop-blur-xl z-40
          absolute lg:relative inset-0
        `}>
          <div className="flex flex-col gap-6">
            <h2 className="text-xs font-mono text-cyan-500 uppercase tracking-widest flex items-center gap-2">
              <User className="w-4 h-4" />
              Subject Profile
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Age Range</label>
                <select 
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value)}
                  className="w-full bg-black/40 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-cyan-500/50 outline-none"
                >
                  <option>Child (5-12)</option>
                  <option>Teen (13-17)</option>
                  <option>Adult (18+)</option>
                </select>
              </div>
              
              <div>
                <label className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Educational Level</label>
                <select 
                  value={educationalLevel}
                  onChange={(e) => setEducationalLevel(e.target.value)}
                  className="w-full bg-black/40 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-cyan-500/50 outline-none"
                >
                  <option>Elementary</option>
                  <option>Middle/High School</option>
                  <option>Academic/Professional</option>
                </select>
              </div>

              <div className="pt-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-mono text-slate-500 uppercase block tracking-widest">Clinical Harshness</label>
                  <div className="flex items-center gap-2">
                    {harshness < 30 ? <Smile className="w-3 h-3 text-emerald-400" /> : <Skull className={`w-3 h-3 ${harshness > 70 ? 'text-red-500 animate-pulse' : 'text-slate-500'}`} />}
                    <span className="text-[10px] font-mono text-cyan-500">{harshness}%</span>
                  </div>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={harshness}
                  onChange={(e) => setHarshness(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <div className="flex justify-between mt-1 px-1">
                  <span className="text-[8px] font-mono text-slate-600 uppercase">Explorer</span>
                  <span className="text-[8px] font-mono text-slate-600 uppercase">Pathologist</span>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-6">
              <div className="flex justify-between items-end mb-4">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Mastery Index</span>
                <span className="text-2xl font-bold font-mono text-cyan-400">{masteryIndex}</span>
              </div>
              <div className="h-20 flex items-end gap-1 px-1">
                {scoreHistory.slice(0, 10).reverse().map((score, i) => (
                  <div key={i} className={`flex-1 rounded-t-sm ${getTierColor(score).split(' ')[2]}`} style={{ height: `${score * 10}%` }} />
                ))}
              </div>
            </div>
            
            <div className="bg-black/40 rounded-lg p-4 border border-slate-800">
              <span className="text-[9px] text-slate-500 font-mono uppercase mb-1 block">Subject Identification</span>
              <code className="text-[10px] text-cyan-500/50 break-all">{subjectId}</code>
            </div>
          </div>
        </aside>

        {/* Center: Full-Screen Laboratory */}
        <section className={`
          ${activeTab === 'lab' ? 'flex' : 'hidden lg:flex'} 
          flex-1 flex-col relative bg-[#0a192f] select-none touch-none
        `}>
          {/* Target Word Overlay */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none text-center">
            <span className="text-[10px] text-cyan-500/50 font-mono uppercase tracking-[0.2em]">
              {curriculumIndex < 26 ? "Letters" : curriculumIndex < 32 ? "Words" : "Sentences"}
            </span>
            <h2 className="text-6xl lg:text-8xl font-cursive text-white drop-shadow-[0_0_30px_rgba(6,182,212,0.4)]">{targetWord}</h2>
          </div>

          {/* Floating HUD Controls */}
          <div className="absolute top-6 right-6 z-30 flex flex-col gap-3">
            <button 
              onClick={clearCanvas}
              className="p-3 rounded-full bg-black/40 backdrop-blur-md border border-slate-700/50 text-slate-400 hover:text-white transition-all active:scale-95"
            >
              <Eraser className="w-5 h-5" />
            </button>
            <button 
              onClick={submitToProfessor}
              disabled={isEvaluating}
              className="p-4 rounded-full bg-cyan-500/20 backdrop-blur-md border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/40 transition-all disabled:opacity-50 active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
            >
              {isEvaluating ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <Activity className="w-6 h-6" />
                </motion.div>
              ) : (
                <Send className="w-6 h-6" />
              )}
            </button>
          </div>

          <div className="absolute bottom-6 left-6 z-30 pointer-events-none hidden lg:flex flex-col gap-2">
            <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-500/70 bg-black/40 px-2 py-1 rounded border border-cyan-500/20 backdrop-blur-md">
              <Droplets className="w-3 h-3" />
              PRESSURE: SENSITIVE
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-500/70 bg-black/40 px-2 py-1 rounded border border-cyan-500/20 backdrop-blur-md">
              <Activity className="w-3 h-3" />
              SAMPLING: 60 HZ
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div className="absolute inset-0 z-10 overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(6,182,212,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.2)_1px,transparent_1px)] bg-[size:30px_30px]" />
            
            {/* Animated Ghost Path Corrective (Wraps raw path string in SVG) */}
            {assessment?.gated_unlocks?.trace_pad_underlay && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
                <svg viewBox="0 0 100 100" className="w-full h-full object-contain">
                  <path 
                    d={assessment.gated_unlocks.trace_pad_underlay.startsWith('<path') 
                        ? (assessment.gated_unlocks.trace_pad_underlay.match(/d="([^"]+)"/) || [])[1] 
                        : assessment.gated_unlocks.trace_pad_underlay
                      } 
                    className="ghost-path" 
                  />
                </svg>
              </div>
            )}

            <canvas
              ref={canvasRef}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerOut={stopDrawing}
              className="w-full h-full cursor-crosshair"
            />
          </div>
        </section>

        {/* Right Column: Feedback (Desktop Side or Mobile Overlay) */}
        <aside className={`
          ${activeTab === 'records' ? 'flex' : 'hidden'} 
          lg:flex lg:w-96 flex-col gap-6 p-6 border-l border-slate-800 bg-[#02050a]/90 backdrop-blur-xl z-40
          absolute lg:relative inset-0
        `}>
          {!assessment && !isEvaluating ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
              <BookOpen className="w-12 h-12 mb-4" />
              <p className="font-mono text-xs uppercase tracking-widest">Awaiting Specimen</p>
            </div>
          ) : assessment ? (
            <div className="flex flex-col gap-6 overflow-y-auto custom-scrollbar pr-2">
              <div className={`p-5 rounded-2xl border ${getTierColor(assessment.academic_assessment.score)} flex items-center justify-between`}>
                <div>
                  <span className="text-[10px] font-mono uppercase opacity-70 block mb-1">Assessment</span>
                  <div className="text-4xl font-bold font-mono">{assessment.academic_assessment.score.toFixed(1)}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase opacity-70 block mb-1">Classification</span>
                  <div className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                    {assessment.academic_assessment.tier_classification}
                  </div>
                </div>
              </div>

              <div className="pl-4 border-l-2 border-cyan-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono text-cyan-500 uppercase">Professor Bathysphere</span>
                  {isSpeaking && <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                </div>
                <p className="text-xl font-serif italic text-slate-100 leading-snug">
                  "{assessment.voice_response.professor_persona}"
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-black/40 p-4 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1 tracking-widest">Prescription</span>
                  <p className="text-sm leading-relaxed text-slate-300">{assessment.diagnostic_analysis.remediation_prescription}</p>
                </div>
                <div className="bg-black/40 p-4 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-500 font-mono uppercase block mb-1 tracking-widest">Diagnostic Failure</span>
                  <p className="text-sm text-red-400/80 font-mono">{assessment.diagnostic_analysis.primary_failure_mode}</p>
                </div>
              </div>
              
              {assessment.gated_unlocks.technique_revealed && (
                <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
                  <span className="text-[10px] text-cyan-400 font-mono uppercase block mb-2">Technique Revealed</span>
                  <p className="text-sm italic text-cyan-100/70">"{assessment.gated_unlocks.technique_revealed}"</p>
                </div>
              )}
            </div>
          ) : null}
        </aside>
      </main>

      {/* Mobile Tab Navigation */}
      <nav className="lg:hidden h-20 bg-black/60 backdrop-blur-xl border-t border-slate-800 flex items-center justify-around px-6 z-50">
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-1 ${activeTab === 'profile' ? 'text-cyan-400' : 'text-slate-500'}`}>
          <User className="w-6 h-6" />
          <span className="text-[10px] font-mono uppercase">Profile</span>
        </button>
        <button onClick={() => setActiveTab('lab')} className={`flex flex-col items-center gap-1 ${activeTab === 'lab' ? 'text-cyan-400' : 'text-slate-500'}`}>
          <div className="p-3 rounded-full bg-cyan-900/40 relative -top-6 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <PenTool className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-mono uppercase -mt-5">Laboratory</span>
        </button>
        <button onClick={() => setActiveTab('records')} className={`flex flex-col items-center gap-1 ${activeTab === 'records' ? 'text-cyan-400' : 'text-slate-500'}`}>
          <BookMarked className="w-6 h-6" />
          <span className="text-[10px] font-mono uppercase">Records</span>
        </button>
      </nav>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
        .font-cursive { font-family: 'Great Vibes', cursive; }
        
        .ghost-path {
          stroke: #00ffcc;
          stroke-width: 2;
          fill: none;
          stroke-linecap: round;
          stroke-dasharray: 2000;
          stroke-dashoffset: 2000;
          animation: hydro-draw 6s ease-in-out infinite alternate;
          filter: drop-shadow(0 0 8px rgba(0, 255, 204, 0.4));
        }
        @keyframes hydro-draw {
          to { stroke-dashoffset: 0; }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
