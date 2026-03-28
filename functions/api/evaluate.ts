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
    
    // --- 2. DEFENSIVE BINDING CHECKS ---
    if (!env.AI) {
      return new Response(JSON.stringify({ error: "AI Binding Offline." }), { status: 500 });
    }
    if (!env.SUBJECT_ARCHIVE) {
      return new Response(JSON.stringify({ error: "KV Binding Offline." }), { status: 500 });
    }

    // --- 3. GEOSPATIAL CONTEXT ---
    const cf = (request as any).cf || {};
    const location = {
      city: cf.city || "Unknown Depth",
      country: cf.country || "The Open Sea",
      lat: cf.latitude,
      lon: cf.longitude
    };

    // --- 4. JAVASCRIPT FORENSIC HELPERS: Tactile Data Extraction ---
    const calculateForensics = (strokes: any[][]) => {
      let uMin = 1, uMax = 0, vMin = 1, vMax = 0;
      let totalPoints = 0, totalPressure = 0;
      let sumU = 0, sumV = 0;
      
      strokes.forEach(stroke => {
        stroke.forEach(pt => {
          uMin = Math.min(uMin, pt.u);
          uMax = Math.max(uMax, pt.u);
          vMin = Math.min(vMin, pt.v);
          vMax = Math.max(vMax, pt.v);
          totalPressure += (pt.p || 0.5);
          sumU += pt.u;
          sumV += pt.v;
          totalPoints++;
        });
      });

      const userCentroid = totalPoints > 0 ? { u: sumU / totalPoints, v: sumV / totalPoints } : { u: 0.5, v: 0.5 };

      return {
        bounds: { 
          u: [uMin.toFixed(3), uMax.toFixed(3)], 
          v: [vMin.toFixed(3), vMax.toFixed(3)] 
        },
        centroid: userCentroid,
        metrics: {
          strokeCount: strokes.length,
          avgPressure: totalPoints > 0 ? (totalPressure / totalPoints).toFixed(2) : "0.50",
          pointDensity: totalPoints
        }
      };
    };

    const forensics = calculateForensics(kinematics);

    // --- 5. CALLIGRAPHIC REFERENCE LIBRARY ---
    const CALLIGRAPHIC_REFERENCES: Record<string, { path: string, centroid: { u: number, v: number } }> = {
      'a': { 
        path: "M 40 60 C 35 60 30 55 30 45 C 30 35 40 30 50 30 C 60 30 70 35 70 45 L 70 60", 
        centroid: { u: 0.5, v: 0.45 } 
      },
      'b': { 
        path: "M 30 80 L 30 20 C 30 10 50 10 50 20 C 50 30 30 30 30 30 C 30 45 60 45 60 65 C 60 85 30 85 30 80", 
        centroid: { u: 0.45, v: 0.5 } 
      },
      'c': { 
        path: "M 70 30 C 60 20 30 20 30 50 C 30 80 60 80 70 70", 
        centroid: { u: 0.5, v: 0.5 } 
      },
      // ... same for d, e, f
    };

    const targetRef = CALLIGRAPHIC_REFERENCES[targetWord.toLowerCase()] || { path: "M 20 50 L 80 50", centroid: { u: 0.5, v: 0.5 } };
    
    // --- SPATIAL ALIGNMENT (Chroma Logic) ---
    const du = forensics.centroid.u - targetRef.centroid.u;
    const dv = forensics.centroid.v - targetRef.centroid.v;
    const spatialDrift = Math.sqrt(du * du + dv * dv).toFixed(3);

    const SYSTEM_PROMPT = `You are PROFESSOR BATHYSPHERE, a master calligrapher and pedagogical analyst.
Your mission is to provide high-fidelity assessments of cursive specimens.

MASTER REFERENCE LIBRARY (Canonical Cursive):
The following SVG path is a PERFECT reconstruction of '${targetWord}':
- Canonical Path: "${targetRef.path}"
- Ideal Centroid: U[${targetRef.centroid.u}], V[${targetRef.centroid.v}]

SPATIAL FORENSIC DATA:
- CENTROID DRIFT (0-1 Scale): ${spatialDrift} (Lower is better precision)
- USER CENTROID: U[${forensics.centroid.u.toFixed(3)}], V[${forensics.centroid.v.toFixed(3)}]
- BOUNDS: U[${forensics.bounds.u}], V[${forensics.bounds.v}]
- STROKES: ${forensics.metrics.strokeCount}
- PRESSURE: ${forensics.metrics.avgPressure}/1.0

INSTRUCTIONS:
1. Compare visual specimen with Canonical Path and Spatial Data.
2. In 'trace_pad_underlay', YOU MUST return a high-fidelity SVG path based on the Canonical Path.
3. If the student drifted spatially (Drift > 0.1), in your 'voice_response', ADDRESS THE POSITIONING error specifically (e.g., "Your loop is shifted too far to the right").
4. Return ONLY valid JSON. Start with {`;

    const prompt = `Evaluate cursive handwriting specimen:
###
TARGET: ${targetWord}
STREAK: ${streak}
###

EXAMPLE OUTPUT PROTOCOL:
{
  "academic_assessment": { "score": 8.5, "tier_classification": "Advanced", "mastery_status": "Mastered", "next_challenge_eligibility": true, "difficulty_adjustment": "Maintain" },
  "diagnostic_analysis": { "primary_failure_mode": "None", "kinematic_anomaly": "None", "remediation_prescription": "Focus on fluid rotation.", "information_disclosure_level": 5 },
  "voice_response": { "professor_persona": "Clinical and impressed.", "emotional_valence": "Positive", "roast_intensity": 2, "hype_coefficient": 8, "emotional_transcription": "Exquisite line work." },
  "gated_unlocks": { "technique_revealed": "None", "historical_exemplar": "None", "visual_feedback": "Perfect alignment.", "next_challenge_preview": "None", "trace_pad_underlay": "${targetRef}" },
  "adaptive_parameters": { "recommended_next_target": "b", "next_curriculum_stage": "Letters", "scaffolding_level": "Minimal", "cognitive_load_adjustment": "Optimal", "retrieval_practice_prompt": "Recall the loop." }
}

INSTRUCTION: Analyze image and return ONLY JSON. Start with {`;

    // 6. Handwriting Evaluation with Vision Model
    const aiResponse: any = await env.AI.run("@cf/meta/llama-3.2-11b-vision-instruct", {
      image: [image],
      prompt: SYSTEM_PROMPT + "\n\nVISUAL CONTEXT: " + prompt,
      max_tokens: 2048
    });

    if (!aiResponse || !aiResponse.response) {
      throw new Error("The Professor is unresponsive. Ocean interference likely.");
    }

    let assessment: any;
    try {
      const raw = aiResponse.response;
      const cleanJson = (input: string): any => {
        // 1. Base Case: already an object
        if (typeof input !== 'string') return input;
        
        // 2. Identify and Extract JSON block (find first { and last })
        const firstChar = input.indexOf('{');
        const lastChar = input.lastIndexOf('}');
        if (firstChar === -1 || lastChar === -1) throw new Error("No JSON block found.");
        
        let target = input.substring(firstChar, lastChar + 1);

        // 3. Recursive attempt to decode (handles double-encoded strings)
        try {
          const parsed = JSON.parse(target);
          return typeof parsed === 'object' ? parsed : cleanJson(parsed);
        } catch (e) {
          // 4. Sanitize and try one last time (handles escaped quotes/newlines)
          try {
            const sanitized = target
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\\\"/g, '\\"');
            return JSON.parse(sanitized);
          } catch {
            throw new Error("Recursive parse failed.");
          }
        }
      };
      assessment = cleanJson(raw);
    } catch (e: any) {
      throw new Error(`Professor's Diagnosis Unreadable: ${aiResponse.response.substring(0, 100)}...`);
    }

    // --- 6.5 CHROMA BACKDROP SYNTHESIS (Mastery Reward) ---
    if (assessment.academic_assessment.score >= 8.0 && env.AI) {
      try {
        const backdropPrompt = `A cinematic, ultra-realistic bioluminescent deep-sea ocean floor scene. In the center, glowing neon coral reefs and ethereal marine life have grown into the perfect shape of the cursive letter "${targetWord}". Ethereal light beams filtering through dark water, 8k resolution, magical atmosphere.`;
        
        const photoResponse: any = await env.AI.run("@cf/black-forest-labs/flux-1-schnell", {
          prompt: backdropPrompt,
          num_steps: 4
        });

        if (photoResponse && photoResponse.image) {
          assessment.gated_unlocks.visual_feedback = `data:image/png;base64,${photoResponse.image}`;
        }
      } catch (artError) {
        console.error("Art Synthesis Failed:", artError);
        // Fail silently; don't break the assessment for a missing backdrop
      }
    }

    // 7. Persistent Archive Write-Back
    await env.SUBJECT_ARCHIVE.put(`subject:${subjectId}:record`, JSON.stringify({
      lastPerformance: assessment,
      history: [assessment.academic_assessment.score, ...scoreHistory].slice(0, 10),
      ageRange,
      educationalLevel,
      location,
      timestamp: new Date().toISOString()
    }));

    return new Response(JSON.stringify(assessment), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
