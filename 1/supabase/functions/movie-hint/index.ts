// Supabase Edge Function — turns a movie's plot summary into one short, spoiler-light
// hint sentence using xAI's Grok. Falls back gracefully (hint: null) if no key is set,
// so the game always works even without this configured.
//
// Deploy:  supabase functions deploy movie-hint --no-verify-jwt
// Secret:  supabase secrets set GROK_API_KEY=xai-...
//          (get a key at https://console.x.ai)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { title, overview } = await req.json();
    const apiKey = Deno.env.get("GROK_API_KEY");

    if (!apiKey || !overview) {
      return new Response(JSON.stringify({ hint: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "grok-2-latest",
        messages: [
          {
            role: "system",
            content:
              "You write one short, playful hint sentence (under 20 words) about a movie's plot for a guessing game. " +
              "Never say the movie's title or any character's proper name. Be vague enough to keep it a fun guess.",
          },
          { role: "user", content: `Movie: "${title}". Plot: ${overview}` },
        ],
        max_tokens: 60,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ hint: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const hint = data?.choices?.[0]?.message?.content?.trim() || null;
    return new Response(JSON.stringify({ hint }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("movie-hint error:", err);
    return new Response(JSON.stringify({ hint: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
