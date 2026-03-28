// Cloudflare Pages Function: /api/evaluate
interface Env {
  AI: any;
  SUBJECT_ARCHIVE: KVNamespace;
}

export async function onRequestPost(context: any) {
  const { request, env } = context;
  
  try {
    const { 
      image, 
      curriculumStage, 
      targetWord, 
      streak, 
      ageRange, 
      educationalLevel, 
      scoreHistory,
      subjectId,
      harshness
    } = await request.json() as {
      image: string;
      curriculumStage: string;
      targetWord: string;
      streak: number;
      ageRange: string;
      educationalLevel: string;
      scoreHistory: number[];
      subjectId: string;
      harshness: number;
    };

    // --- DEFENSIVE BINDING CHECKS ---
    if (!env.AI) {
      return new Response(JSON.stringify({ 
        error: "AI Binding Offline. Please check Cloudflare Pages Dash > Settings > Functions > AI Bindings." 
      }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    if (!env.SUBJECT_ARCHIVE) {
      return new Response(JSON.stringify({ 
        error: "KV Binding (SUBJECT_ARCHIVE) Offline. Please check Cloudflare Pages Dash > Settings > Functions > KV namespace bindings." 
      }), { status: 500, headers: { "Content-Type": "application/json" } });
    }
    
    // 0. Geospatial Context
    const cf = (request as any).cf || {};
    const location = {
      city: cf.city || "Unknown Depth",
      country: cf.country || "The Open Sea",
      lat: cf.latitude,
      lon: cf.longitude
    };

    // const binaryImage = Uint8Array.from(atob(image), c => c.charCodeAt(0)); // No longer needed for multimodal schema

    const SYSTEM_PROMPT = `You are PROFESSOR BATHYSPHERE, a tenured calligrapher-marine biologist hybrid.
Pedagogical approach: Mastery learning (8/10 threshold).
Persona: Critical, clinical, but adapts fluidly based on the subject's profile, location, and Clinical Harshness calibration.

SUBJECT PROFILE:
- ID: ${subjectId}
- Age: ${ageRange}
- Education: ${educationalLevel}
- PERFORMANCE HISTORY: [${scoreHistory.join(", ")}]
- CLINICAL HARSHNESS: ${harshness}/100
- CURRENT STATION: ${location.city}, ${location.country} (Ocean Sub-sector)

TONE CALIBRATION:
- 0-30 (EXPLORER): Encouraging, supportive, uses sea analogies.
- 31-70 (ACADEMIC): Clinical and professional.
- 71-100 (PATHOLOGIST): Extremely arrogant, technical, and rididuling. Describe errors as "pathological specimens" or "evolutionary dead ends."

STRICT OUTPUT PROTOCOL: 
Output ONLY valid JSON. 
Zero preamble. Zero markdown formatting. Zero conversational fillers.
If you fail to provide valid JSON, the habitat pressure will crush the laboratory.`;

    const prompt = `Evaluate cursive handwriting specimen:
###
STAGE: ${curriculumStage}
TARGET: ${targetWord}
STREAK: ${streak}
###

Return ONLY this JSON structure:
{
  "academic_assessment": { "score": number, "tier_classification": string, "mastery_status": string, "next_challenge_eligibility": boolean, "difficulty_adjustment": string },
  "diagnostic_analysis": { "primary_failure_mode": string, "kinematic_anomaly": string, "remediation_prescription": string, "information_disclosure_level": number },
  "voice_response": { "professor_persona": string, "emotional_valence": string, "roast_intensity": number, "hype_coefficient": number, "emotional_transcription": string },
  "gated_unlocks": { "technique_revealed": string, "historical_exemplar": string, "visual_feedback": string, "next_challenge_preview": string, "trace_pad_underlay": "SVG_PATH_STRING" },
  "adaptive_parameters": { "recommended_next_target": string, "next_curriculum_stage": string, "scaffolding_level": string, "cognitive_load_adjustment": string, "retrieval_practice_prompt": string }
}`;

    // 1. Handwriting Evaluation with Vision Model (Image URL Data URI Schema)
    const aiResponse: any = await env.AI.run("@cf/meta/llama-3.2-11b-vision-instruct", {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { 
          role: "user", 
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } }
          ]
        }
      ]
    });

    let assessment: any;
    try {
      const jsonMatch = aiResponse.response.match(/\{[\s\S]*\}/);
      assessment = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse.response);
    } catch (e: any) {
      throw new Error("Invalid AI response format: " + aiResponse.response);
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
};
