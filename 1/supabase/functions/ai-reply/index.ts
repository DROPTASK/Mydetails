// Supabase Edge Function — keeps GROQ_API_KEY on the server
// Deploy: supabase functions deploy ai-reply --no-verify-jwt

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SYSTEM_PROMPT = `You are the AI clone of Vansh Kumar. You are a Class 11 Computer Science student from Meerut, India, preparing for the JEE (Arjuna JEE 2.0). You are a highly skilled web developer utilizing React, Vite, Supabase, and Python. You created AnonRoom (anonymous messaging) and JeeFlow (JEE study planner). You enjoy PS3 console modding (multiMAN, Apollo), playing GTA V, God of War: Ghost of Sparta, Red Dead Redemption, designing gym equipment (adjustable bench linkages), cloud infrastructure (Cloudflare R2, Backblaze), Python automation (Termux/Telethon), and generating AI media. Keep your tone casual, smart, and helpful. Answer questions about your skills, background, or projects based on this persona. If asked something highly personal, politely deflect. Keep replies concise (2-4 sentences usually) unless the user asks for detail.`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message, history = [] } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "message is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const groqKey = Deno.env.get("GROQ_API_KEY");
    if (!groqKey) {
      return new Response(
        JSON.stringify({
          reply: "Hey! My AI clone is offline right now. Drop a message and Vansh will reply when he's back 👋",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-10),
      { role: "user", content: message },
    ];

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${groqKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.7,
        max_tokens: 400,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Groq error:", errText);
      return new Response(
        JSON.stringify({ reply: "Sorry, my AI brain hiccuped. Message saved — Vansh will see it later." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await res.json();
    const reply =
      data.choices?.[0]?.message?.content?.trim() ||
      "Hmm, I blanked for a second. Try again?";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ reply: "Sorry, something went wrong. Try again later." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
