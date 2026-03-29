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

    // --- 4. CALLIGRAPHIC REFERENCE LIBRARY (Authentic Looped Cursive) ---
    const pureTarget = targetWord.split(' ').pop()?.toLowerCase() || targetWord.toLowerCase();
    
    const REFERENCES: Record<string, { path: string, centroid: { u: number, v: number } }> = {
      'a': { 
        path: "M 70 45 C 70 35 60 30 50 30 C 40 30 30 35 30 45 C 30 55 40 60 50 60 C 60 60 70 55 70 45 M 70 30 L 70 60 C 70 65 75 70 85 70", 
        centroid: { u: 0.5, v: 0.45 } 
      },
      'b': { 
        path: "M 30 80 L 30 25 C 30 10 50 10 50 25 C 50 40 30 40 30 40 C 30 50 65 50 65 70 C 65 90 30 90 30 80", 
        centroid: { u: 0.45, v: 0.5 } 
      },
      'c': { 
        path: "M 75 40 C 70 30 50 25 35 45 C 25 65 45 80 65 75 C 75 70 80 60 80 60", 
        centroid: { u: 0.5, v: 0.5 } 
      },
      'd': { 
        path: "M 75 15 L 75 75 M 75 50 C 75 35 60 30 45 30 C 30 30 25 45 25 55 C 25 70 40 80 60 75 C 70 70 75 60 75 50", 
        centroid: { u: 0.5, v: 0.45 } 
      },
      'e': { 
        path: "M 30 65 C 30 65 80 65 80 50 C 80 25 30 25 30 50 C 30 75 80 75 90 65", 
        centroid: { u: 0.5, v: 0.5 } 
      },
      'f': { 
        path: "M 55 85 L 55 15 C 55 0 85 0 85 15 C 85 35 55 35 55 40 L 55 85 M 35 50 L 75 50", 
        centroid: { u: 0.5, v: 0.3 } 
      },
    };
    const targetRef = REFERENCES[pureTarget] || { path: "M 20 50 L 80 50", centroid: { u: 0.5, v: 0.5 } };
    
    // --- SPATIAL ALIGNMENT (Chroma Logic Refined) ---
    const du = forensics.centroid.u - targetRef.centroid.u;
    const dv = forensics.centroid.v - targetRef.centroid.v;
    const centroidDrift = Math.sqrt(du * du + dv * dv);

    // SCALE DIVERGENCE: Calculate if the student's drawing is too small (Miniature)
    const userArea = (parseFloat(forensics.bounds.u[1]) - parseFloat(forensics.bounds.u[0])) * 
                     (parseFloat(forensics.bounds.v[1]) - parseFloat(forensics.bounds.v[0]));
    const targetArea = 0.15; // Refined benchmark (15% of canvas area)
    const scaleRatio = Math.min(1, userArea / targetArea);
    
    // FINAL SPATIAL SCORE (Combines Centroid Logic + Scale Logic)
    // If drawing is tiny, Alignment drops even if centered.
    const alignmentScore = Math.max(0, (1 - (centroidDrift * 1.5)) * scaleRatio);

    const BRAIN_SYSTEM_PROMPT = `You are PROFESSOR BATHYSPHERE, a master calligrapher and pedagogical analyst.
Your mission is to provide high-fidelity assessments of cursive specimens.

STRICT PROTOCOL: 
- DO NOT return meta-comments or "thinking out loud" (e.g. ".adjust scale").
- Return ONLY the JSON object.

SPATIAL VISION DATA:
- GEOMETRIC ALIGNMENT (0-1): ${alignmentScore.toFixed(3)}
- SCALE RATIO (Target 1.0): ${scaleRatio.toFixed(3)} ( < 0.25 means "Miniature" )
- CENTROID DRIFT: ${centroidDrift.toFixed(3)}
- BOUNDS: U[${forensics.bounds.u}], V[${forensics.bounds.v}]
- STROKES: ${forensics.metrics.strokes}

GUIDELINES FOR THE PROFESSOR:
1. UPPERCASE ERROR: If LOWERCASE was requested but UPPERCASE was provided, MAX SCORE IS 3.0.
2. SCALE ERROR: If SCALE RATIO < 0.3: SCORING CEILING IS 5.0. Scold the student for drawing too small.
3. ALIGNMENT: If > 0.8 and Scale is good, be impressed.`;

    // --- PHASE 1: THE EYE (Vision Specialist) ---
    const visionResponse: any = await env.AI.run("@cf/meta/llama-3.2-11b-vision-instruct", {
      image: [image],
      prompt: `Strictly critique this CURSIVE specimen for "${targetWord}". 
               
               CATEGORICAL AUDIT:
               1. Identify the Case: Is this Lowercase "${pureTarget}" or Uppercase "${pureTarget.toUpperCase()}"?
               2. If it is high-quality UPPERCASE when LOWERCASE was requested, explicitly state: "Excellent uppercase form, but wrong case."
               3. If the shape is NOT the letter "${pureTarget}" at all, identify it as "Unstructured".
               
               SPATIAL AUDIT:
               - Does it sit between the BASELINE (V=75%) and the MEAN LINE (V=50%)?
               - Does it have the characteristic cursives loops for "${pureTarget}"?
               
               Return a clinical, brief description of the formation quality and case.`,
      max_tokens: 512
    });
    const visualCritique = visionResponse.response || "Inconclusive scan.";

    // --- PHASE 2: THE BRAIN (Synthesis Specialist) ---
    const brainPrompt = `You are PROFESSOR BATHYSPHERE. 
Synthesize a forensic report into a strictly valid JSON object.

PEDAGOGICAL NUANCE:
- WRONG CASE, GOOD FORM: If Phase 1 detected a high-quality UPPERCASE "${pureTarget.toUpperCase()}" but we wanted LOWERCASE, award a Score of 5.5. Praise the calligraphic form in 'voice_response' but insist on the miniscule for the retry.
- SCALE ERROR: If SCALE RATIO < 0.3 (Miniature), MAX SCORE IS 5.0.
- PASSING GRADE (next_challenge_eligibility = true) is Score >= 7.0.
- MASTERY STATUS (mastery_status = 'Mastered') is Score >= 8.5.

VISUAL CRITIQUE: "${visualCritique}"
FORENSIC DATA: Strokes: ${forensics.metrics.strokes}, Scale Ratio: ${scaleRatio}, Centroid Drift: ${centroidDrift}
TARGET SUBJECT: "${targetWord}"
CANONICAL PATH: "${targetRef.path}"

LAB PROTOCOL: 
Output ONLY valid JSON.
{
  "academic_assessment": { "score": 1-10, "tier_classification": "string", "mastery_status": "Mastered/Fail", "next_challenge_eligibility": true/false, "difficulty_adjustment": "Maintain/Ease/Advance" },
  "diagnostic_analysis": { "primary_failure_mode": "string", "spatial_drift": ${centroidDrift}, "remediation_prescription": "string", "information_disclosure_level": 5 },
  "voice_response": { "professor_persona": "Clinical", "emotional_valence": "string", "roast_intensity": 1-10, "hype_coefficient": 1-10, "emotional_transcription": "A professor-esque summary." },
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
