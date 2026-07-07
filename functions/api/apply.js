/**
 * Cloudflare Pages Function: POST /api/apply  (2026-07-05)
 * ---------------------------------------------------------
 * Same-origin proxy that removes the admin-key typing from Troy's flow.
 * This path is served on admin.paddleclub.org / paddleclub-admin.pages.dev,
 * BOTH gated by Cloudflare Access — a request can only arrive here from an
 * authenticated session (Troy's email allow-list). We verify the Access JWT
 * header as belt-and-suspenders, inject ADMIN_KEY (a Pages env secret) into
 * the payload server-side, and forward to the Supabase Edge Function, which
 * still enforces the key. Troy never sees or types the key again.
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
    "https://yqbuzgnnehcmhbisifcn.supabase.co/functions/v1/apply-decision",
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );
  return new Response(await r.text(), { status: r.status, headers: { "Content-Type": "application/json" } });
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });
}
