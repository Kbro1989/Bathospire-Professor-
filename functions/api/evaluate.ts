// Cloudflare Pages Function: /api/evaluate
interface Env {
  AI: any;
  SUBJECT_ARCHIVE: KVNamespace;
}

export async function onRequestPost(context: any) {
  const { request, env } = context;
  
  try {
    // --- 1. DATA EXTRACTION & FORENSICS ---
    const body = await request.json() as any;
    const { 
      image, targetWord, streak, 
      ageRange, educationalLevel, scoreHistory, 
      subjectId, harshness, kinematics = [] 
    } = body;
    
    // --- 2. DEFENSIVE BINDING ---
    if (!env.AI) return new Response(JSON.stringify({ error: "AI Binding Offline." }), { status: 500 });
    if (!env.SUBJECT_ARCHIVE) return new Response(JSON.stringify({ error: "KV Offline." }), { status: 500 });

    // --- 3. GEOSPATIAL & FORENSIC HELPERS ---
    const cf = (request as any).cf || {};
    const location = { city: cf.city || "Abyss", country: cf.country || "Sea" };

    const calculateForensics = (strokes: any[][]) => {
      let uMin = 1, uMax = 0, vMin = 1, vMax = 0;
      let totalPts = 0, totalP = 0, sumU = 0, sumV = 0;
      strokes.forEach(s => s.forEach(pt => {
        uMin = Math.min(uMin, pt.u); uMax = Math.max(uMax, pt.u);
        vMin = Math.min(vMin, pt.v); vMax = Math.max(vMax, pt.v);
        totalP += (pt.p || 0.5); sumU += pt.u; sumV += pt.v; totalPts++;
      }));
      return {
        bounds: { u: [uMin.toFixed(3), uMax.toFixed(3)], v:[vMin.toFixed(3), vMax.toFixed(3)] },
        centroid: totalPts > 0 ? { u: sumU / totalPts, v: sumV / totalPts } : { u: 0.5, v: 0.5 },
        metrics: { strokes: strokes.length, avgP: (totalP / totalPts || 0.5).toFixed(2), pointDensity: totalPts }
      };
    };
    const forensics = calculateForensics(kinematics);

    // --- 4. CALLIGRAPHIC REFERENCE ---
    const pureTarget = targetWord.split(' ').pop()?.toLowerCase() || targetWord.toLowerCase();
    
    const REFERENCES: Record<string, { path: string, centroid: { u: number, v: number } }> = {
      'a': { path: "M 40 60 C 35 60 30 55 30 45 C 30 35 40 30 50 30 C 60 30 70 35 70 45 L 70 60", centroid: { u: 0.5, v: 0.45 } },
      'b': { path: "M 30 80 L 30 20 C 30 10 50 10 50 20 C 50 30 30 30 30 30 C 30 45 60 45 60 65 C 60 85 30 85 30 80", centroid: { u: 0.45, v: 0.5 } },
      'c': { path: "M 70 30 C 60 20 30 20 30 50 C 30 80 60 80 70 70", centroid: { u: 0.5, v: 0.5 } },
      'd': { path: "M 70 10 L 70 60 M 70 45 C 70 35 60 30 50 30 C 40 30 30 35 30 45 C 30 55 40 60 50 60 C 60 60 70 55 70 45", centroid: { u: 0.5, v: 0.45 } },
      'e': { path: "M 30 50 C 30 30 70 30 70 50 C 70 70 30 70 30 50 L 70 50", centroid: { u: 0.5, v: 0.5 } },
      'f': { path: "M 50 80 L 50 10 C 50 0 70 0 70 10 C 70 20 50 20 50 30 L 50 60 M 35 45 L 65 45", centroid: { u: 0.5, v: 0.3 } },
      // ... more letters would go here
    };
    const targetRef = REFERENCES[pureTarget] || { path: "M 20 50 L 80 50", centroid: { u: 0.5, v: 0.5 } };
    const drift = Math.sqrt(Math.pow(forensics.centroid.u - targetRef.centroid.u, 2) + Math.pow(forensics.centroid.v - targetRef.centroid.v, 2)).toFixed(3);

    // --- PHASE 1: THE EYE (Vision Specialist) ---
    const visionResponse: any = await env.AI.run("@cf/meta/llama-3.2-11b-vision-instruct", {
      image: [image],
      prompt: `Strictly critique this specimen for "${targetWord}". 
               1. If the shape is NOT the letter "${pureTarget}" (e.g. just a line, a hyphen, or empty), assign a score of 1.0.
               2. Analyze cursive formation: loops, stems, and terminal strokes.
               3. Compare to "${targetWord}" specifically.
               Return a clinical, brief description of the formation quality.`,
      max_tokens: 512
    });
    const visualCritique = visionResponse.response || "Inconclusive scan.";

    // --- PHASE 2: THE BRAIN (Synthesis Specialist) ---
    const brainPrompt = `You are PROFESSOR BATHYSPHERE. 
Synthesize a forensic report into a strictly valid JSON object.

ANALYSIS GUIDELINES:
- IF Specimen is NOT a character (e.g. just a hyphen '-'), SCORE IS 1.0.
- PASSING GRADE (next_challenge_eligibility = true) is Score >= 7.0.
- MASTERY STATUS (mastery_status = 'Mastered') is Score >= 8.5.

VISUAL CRITIQUE: "${visualCritique}"
FORENSIC DATA: Strokes: ${forensics.metrics.strokes}, Pressure: ${forensics.metrics.avgP}, Spatial Drift: ${drift}
TARGET SUBJECT: "${targetWord}" (Pure: ${pureTarget})
CANONICAL PATH: "${targetRef.path}"

VISUAL CRITIQUE: "${visualCritique}"
FORENSIC DATA: Strokes: ${forensics.metrics.strokes}, Pressure: ${forensics.metrics.avgP}, Spatial Drift: ${drift}
TARGET WORD: "${targetWord}"
CANONICAL PATH: "${targetRef.path}"

LAB PROTOCOL: 
Output ONLY valid JSON.
{
  "academic_assessment": { "score": 1-10, "tier_classification": "string", "mastery_status": "Mastered/Fail", "next_challenge_eligibility": true/false, "difficulty_adjustment": "Maintain/Ease/Advance" },
  "diagnostic_analysis": { "primary_failure_mode": "string", "spatial_drift": ${drift}, "remediation_prescription": "string", "information_disclosure_level": 5 },
  "voice_response": { "professor_persona": "Clinical", "emotional_valence": "string", "roast_intensity": 1-10, "hype_coefficient": 1-10, "emotional_transcription": "A professor-esque summary of the critique and forensics." },
  "gated_unlocks": { "technique_revealed": "string", "historical_exemplar": "string", "visual_feedback": "string", "next_challenge_preview": "string", "trace_pad_underlay": "${targetRef.path}" },
  "adaptive_parameters": { "recommended_next_target": "string", "next_curriculum_stage": "Letters/Words/Sentences" }
}`;

    const brainResponse: any = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      prompt: brainPrompt,
      max_tokens: 1024
    });

    let assessment: any;
    try {
      const raw = brainResponse.response;
      const cleanJson = (input: string): any => {
        const first = input.indexOf('{'); const last = input.lastIndexOf('}');
        if (first === -1 || last === -1) throw new Error("JSON Missing.");
        let target = input.substring(first, last+1).replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(target);
      };
      assessment = cleanJson(raw);
    } catch (e) {
      throw new Error(`Brain Synthesis Offline: ${brainResponse.response.substring(0, 100)}`);
    }

    // --- PHASE 3: THE ARTIST (Art Specialist) ---
    if (assessment.academic_assessment.score >= 8.0) {
      try {
        const artResponse: any = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
          prompt: `A bioluminescent deep-sea reef grown into the shape of cursive letter "${targetWord}". Cinematic, 8k.`,
          num_steps: 4
        });
        if (artResponse?.image) assessment.gated_unlocks.visual_feedback = `data:image/png;base64,${artResponse.image}`;
      } catch (ae) { console.error("Art failed", ae); }
    }

    // --- 7. ARCHIVE & RETURN ---
    await env.SUBJECT_ARCHIVE.put(`subject:${subjectId}:record`, JSON.stringify({
      lastPerformance: assessment,
      history: [assessment.academic_assessment.score, ...scoreHistory].slice(0, 10),
      ageRange, location, timestamp: new Date().toISOString()
    }));

    return new Response(JSON.stringify(assessment), { headers: { "Content-Type": "application/json" } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
