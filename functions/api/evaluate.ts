// Cloudflare Pages Function: /api/evaluate
interface Env {
  AI: any;
  SUBJECT_ARCHIVE: KVNamespace;
}

export async function onRequestPost(context: any) {
  const { request, env } = context;
  
  try {
    // --- DATA EXTRACTION & FORENSICS ---
    const body = await request.json() as any;
    const { 
      image, curriculumStage, targetWord, streak, 
      ageRange, educationalLevel, scoreHistory, 
      subjectId, harshness, kinematics = [] 
    } = body;
    
    // --- DEFENSIVE BINDING CHECKS ---
    if (!env.AI) {
      return new Response(JSON.stringify({ error: "AI Binding Offline." }), { status: 500 });
    }
    if (!env.SUBJECT_ARCHIVE) {
      return new Response(JSON.stringify({ error: "KV Binding Offline." }), { status: 500 });
    }

    // --- GEOSPATIAL CONTEXT ---
    const cf = (request as any).cf || {};
    const location = {
      city: cf.city || "Unknown Depth",
      country: cf.country || "The Open Sea",
      lat: cf.latitude,
      lon: cf.longitude
    };

    // --- JAVASCRIPT FORENSIC HELPERS: Tactile Data Extraction ---
    const calculateForensics = (strokes: any[][]) => {
      let uMin = 1, uMax = 0, vMin = 1, vMax = 0;
      let totalPoints = 0, totalPressure = 0;
      
      strokes.forEach(stroke => {
        stroke.forEach(pt => {
          uMin = Math.min(uMin, pt.u);
          uMax = Math.max(uMax, pt.u);
          vMin = Math.min(vMin, pt.v);
          vMax = Math.max(vMax, pt.v);
          totalPressure += (pt.p || 0.5);
          totalPoints++;
        });
      });

      return {
        bounds: { 
          u: [uMin.toFixed(3), uMax.toFixed(3)], 
          v: [vMin.toFixed(3), vMax.toFixed(3)] 
        },
        metrics: {
          strokeCount: strokes.length,
          avgPressure: totalPoints > 0 ? (totalPressure / totalPoints).toFixed(2) : "0.50",
          pointDensity: totalPoints
        }
      };
    };

    const forensics = calculateForensics(kinematics);

    const SYSTEM_PROMPT = `You are PROFESSOR BATHYSPHERE, a tenured calligrapher-marine biologist hybrid.
Pedagogical approach: Mastery learning (8/10 threshold).
Persona: Critical, clinical, but adapts fluidly based on the subject's profile, location, and Clinical Harshness calibration.

FORENSIC LAB DATA (Tactile Specs):
- STROKES DETECTED: ${forensics.metrics.strokeCount}
- AVG PRESSURE: ${forensics.metrics.avgPressure}/1.0
- SPATIAL BOUNDS (0-1 Scale): U[${forensics.bounds.u}], V[${forensics.bounds.v}]

SUBJECT PROFILE:
- ID: ${subjectId}
- Age: ${ageRange}
- Education: ${educationalLevel}
- PERFORMANCE HISTORY: [${scoreHistory.join(", ")}]
- CLINICAL HARSHNESS: ${harshness}/100
- CURRENT STATION: ${location.city}, ${location.country} (Ocean Sub-sector)

STRICT OUTPUT PROTOCOL: 
Output ONLY valid JSON. Zero preamble. Start with {`;

    const prompt = `Evaluate cursive handwriting specimen:
###
STAGE: ${curriculumStage}
TARGET: ${targetWord}
STREAK: ${streak}
###

EXAMPLE OUTPUT PROTOCOL:
{
  "academic_assessment": { "score": 8.5, "tier_classification": "Advanced", "mastery_status": "Mastered", "next_challenge_eligibility": true, "difficulty_adjustment": "Maintain" },
  "diagnostic_analysis": { "primary_failure_mode": "None", "kinematic_anomaly": "Slight jitter on ascender", "remediation_prescription": "Focus on fluid wrist rotation.", "information_disclosure_level": 5 },
  "voice_response": { "professor_persona": "Clinical and impressed.", "emotional_valence": "Positive", "roast_intensity": 2, "hype_coefficient": 8, "emotional_transcription": "Exquisite line work, Subject." },
  "gated_unlocks": { "technique_revealed": "Feather-light pressure", "historical_exemplar": "Palmer Method", "visual_feedback": "Perfect baseline alignment.", "next_challenge_preview": "Connected loops", "trace_pad_underlay": "M 40 60 C 35 60 30 55 30 45 C 30 35 40 30 50 30 C 60 30 70 35 70 45 L 70 60" },
  "adaptive_parameters": { "recommended_next_target": "b", "next_curriculum_stage": "Connected Letters", "scaffolding_level": "Minimal", "cognitive_load_adjustment": "Optimal", "retrieval_practice_prompt": "Recall the loop entry." }
}

INSTRUCTION: Analyze the image and return ONLY the JSON. No markdown. No intro. 
The 'trace_pad_underlay' MUST be an anatomically correct, high-fidelity CURSIVE SVG path (d-attribute) on a 0-100 coordinate scale.
Do not return simple arches. Return the actual cursive construction of the letter '${targetWord}'.
Start with {`;

    // 1. Handwriting Evaluation with Vision Model (Image URL Data URI Schema)
    const aiResponse: any = await env.AI.run("@cf/meta/llama-3.2-11b-vision-instruct", {
      messages: [
        { 
          role: "system", 
          content: SYSTEM_PROMPT + "\n\nVISUAL CONTEXT: You are analyzing a High-Contrast Clinical Scan (Dark ink on White background). Locate the central specimen and perform a precise calligraphic audit." 
        },
        { 
          role: "user", 
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } }
          ]
        }
      ],
      max_tokens: 2048
    });

    let assessment: any;
    try {
      let raw = aiResponse.response;
      
      // Recursive unescape for double-encoded strings from AI gateway
      const cleanJson = (input: any): any => {
        if (typeof input === 'object') return input;
        try {
          const parsed = JSON.parse(input);
          return typeof parsed === 'object' ? parsed : cleanJson(parsed);
        } catch {
          const match = input.match(/\{[\s\S]*\}/);
          return match ? JSON.parse(match[0]) : JSON.parse(input);
        }
      };

      assessment = cleanJson(raw);
    } catch (e: any) {
      throw new Error(`Professor's Diagnosis Unreadable: ${JSON.stringify(aiResponse.response).substring(0, 100)}...`);
    }

    // 2. Persistent Archive Write-Back
    const score = assessment.academic_assessment.score;
    const newHistory = [score, ...scoreHistory].slice(0, 50);
    
    if (env.SUBJECT_ARCHIVE && subjectId) {
      await env.SUBJECT_ARCHIVE.put(`subject:${subjectId}:record`, JSON.stringify({
        ageRange,
        educationalLevel,
        scoreHistory: newHistory,
        lastSeen: new Date().toISOString(),
        location
      }));
    }

    // 3. Generate Speech (TTS)
    let audioBase64 = null;
    try {
      const ttsResponse: any = await env.AI.run("@cf/deepgram/aura-1", {
        text: assessment.voice_response.professor_persona
      });
      
      if (ttsResponse) {
        const arrayBuffer = await new Response(ttsResponse).arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        audioBase64 = btoa(binary);
      }
    } catch (e: any) {
      console.log("TTS failed, skipping backend audio", e.message);
    }

    return new Response(JSON.stringify({ 
      ...assessment, 
      audio: audioBase64,
      location // Pass location back to frontend for HUD
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
