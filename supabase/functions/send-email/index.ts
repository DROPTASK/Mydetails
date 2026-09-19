// Supabase Edge Function — sends email over real SMTP.
// Keeps SMTP host/username/password on the server as secrets, never in the browser bundle.
// Deploy: supabase functions deploy send-email --no-verify-jwt
//
// Set these secrets first (Supabase Dashboard → Edge Functions → Secrets, or `supabase secrets set`):
//   SMTP_HOST=smtp.yourprovider.com
//   SMTP_PORT=587
//   SMTP_USERNAME=you@yourdomain.com
//   SMTP_PASSWORD=your-smtp-password
//   SMTP_FROM=you@yourdomain.com          (optional — defaults to SMTP_USERNAME)
//   SMTP_FROM_NAME=Vansh Kumar Portfolio  (optional)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, text, html } = await req.json();

    if (!isValidEmail(to)) {
      return new Response(JSON.stringify({ error: "A valid 'to' email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!subject || !text) {
      return new Response(JSON.stringify({ error: "'subject' and 'text' are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const host = Deno.env.get("SMTP_HOST");
    const port = Number(Deno.env.get("SMTP_PORT") || "587");
    const username = Deno.env.get("SMTP_USERNAME");
    const password = Deno.env.get("SMTP_PASSWORD");
    const from = Deno.env.get("SMTP_FROM") || username;
    const fromName = Deno.env.get("SMTP_FROM_NAME") || "Vansh Kumar Portfolio";

    if (!host || !username || !password || !from) {
      // Don't fail the caller's flow just because email isn't configured yet.
      console.warn("send-email: SMTP secrets not fully configured — skipping send.");
      return new Response(JSON.stringify({ skipped: true, reason: "SMTP not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = new SMTPClient({
      connection: {
        hostname: host,
        port,
        tls: port === 465,
        auth: { username, password },
      },
    });

    await client.send({
      from: `${fromName} <${from}>`,
      to,
      subject,
      content: text,
      html: html || undefined,
    });
    await client.close();

    return new Response(JSON.stringify({ sent: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-email error:", err);
    return new Response(JSON.stringify({ error: "Failed to send email" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
