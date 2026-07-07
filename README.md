# Bathospire Professor — AI Cursive Writing Tutor

> React · TypeScript · Vite · Cloudflare Pages · Workers AI · Framer Motion

AI-graded cursive writing tutor. Canvas stroke input → Cloudflare AI assessment →
adaptive feedback + TTS voice response from Professor Bathysphere.

## Curriculum

26 lowercase letters (a–z) → words (Sea, Kelp, Reef, Tide, Pearl, Abyss) →
phrases (Hello Lab, Cursive Mastery, Professor Bathysphere)

## Assessment Schema

```typescript
{
  academic_assessment: { score, tier_classification, mastery_status, difficulty_adjustment },
  diagnostic_analysis: { primary_failure_mode, kinematic_anomaly, remediation_prescription },
  voice_response: { professor_persona, roast_intensity, hype_coefficient, emotional_transcription },
  gated_unlocks: { technique_revealed, historical_exemplar, trace_pad_underlay },
  adaptive_parameters: { next_challenge, scaffolding_level, cognitive_load_adjustment }
}
```

## Architecture

```
src/
├── App.tsx       # Canvas + assessment UI + streak tracker + subject profile
├── main.tsx
└── utils/
functions/        # Cloudflare Pages Functions — grading + TTS (backend)
```
