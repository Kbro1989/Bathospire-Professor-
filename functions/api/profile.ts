// Cloudflare Pages Function: /api/profile
interface Env {
  SUBJECT_ARCHIVE: KVNamespace;
}

export async function onRequestGet(context: any) {
  const { request, env } = context;
  const url = new URL(request.url);
  const subjectId = url.searchParams.get("subjectId");

  if (!subjectId || !env.SUBJECT_ARCHIVE) {
    return new Response(JSON.stringify({ error: "Vault access denied" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  const record = await env.SUBJECT_ARCHIVE.get(`subject:${subjectId}:record`);
  
  return new Response(record || JSON.stringify({ message: "New Subject" }), {
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequestPost(context: any) {
  const { request, env } = context;
  const { subjectId, profile } = await request.json() as { subjectId: string, profile: any };

  if (!subjectId || !env.SUBJECT_ARCHIVE) {
    return new Response(JSON.stringify({ error: "Vault synchronization failed" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  await env.SUBJECT_ARCHIVE.put(`subject:${subjectId}:record`, JSON.stringify({
    ...profile,
    lastSync: new Date().toISOString()
  }));

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
}
