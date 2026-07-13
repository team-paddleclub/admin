/**
 * Cloudflare Pages Function: POST /api/inquiries  (2026-07-12)
 * ------------------------------------------------------------
 * Same-origin proxy for the console's Inquiries panel — identical
 * pattern to /api/apply: only reachable through Cloudflare Access,
 * verifies the Access JWT header, injects ADMIN_KEY (Pages env
 * secret) server-side, forwards to the admin-inquiries Edge
 * Function. Troy never sees or types the key.
 */
export async function onRequestPost(context) {
  const req = context.request;

  // Present only on requests that passed Cloudflare Access.
  if (!req.headers.get("cf-access-jwt-assertion")) {
    return json({ ok: false, reason: "no access session" }, 403);
  }

  let body = {};
  try { body = await req.json(); } catch (_e) { /* forwarded as empty */ }
  body.key = (context.env.ADMIN_KEY || "").trim();

  const r = await fetch(
    "https://yqbuzgnnehcmhbisifcn.supabase.co/functions/v1/admin-inquiries",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );
  return new Response(await r.text(), { status: r.status, headers: { "Content-Type": "application/json" } });
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}
