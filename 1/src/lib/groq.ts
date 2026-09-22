import { supabase } from "./supabase";

/**
 * Intelligent built-in knowledge response engine for Vansh Kumar's portfolio.
 * Used automatically when the Supabase Edge Function is not yet deployed,
 * ensuring guests get an immediate, helpful response.
 */
function getBuiltinPortfolioReply(query: string): string {
  const q = query.toLowerCase();

  if (q.includes("anonroom") || q.includes("chat room") || q.includes("anonymous")) {
    return "AnonRoom is Vansh's real-time ephemeral chat web app! It lets people create disposable rooms with simple join codes, chat live via WebSockets, and leaves zero chat history once everyone leaves.";
  }

  if (q.includes("jeeflow") || q.includes("jee") || q.includes("cbse") || q.includes("prep") || q.includes("exam")) {
    return "Vansh is currently in Class 12 following the CBSE curriculum! He built JeeFlow, a study-tracking and countdown planner, alongside his coursework.";
  }

  if (q.includes("project") || q.includes("what are you working on") || q.includes("built") || q.includes("portfolio")) {
    return "Vansh is actively developing AnonRoom (live anonymous chat) and JeeFlow (study planner). He also engineered this entire interactive portfolio with retro-modern sound synthesis, a live Bollywood movie arcade, and real-time chat!";
  }

  if (q.includes("stack") || q.includes("tech") || q.includes("skill") || q.includes("language") || q.includes("framework")) {
    return "Vansh's primary stack includes React 18, TypeScript, Tailwind CSS, Supabase, PostgreSQL, and Node.js. For problem-solving and scripting, he uses Python and C++ alongside Linux and Git.";
  }

  if (q.includes("where") || q.includes("location") || q.includes("live") || q.includes("city")) {
    return "Vansh is based in Uttar Pradesh, India (IST timezone).";
  }

  if (q.includes("contact") || q.includes("email") || q.includes("hire") || q.includes("reach") || q.includes("collab") || q.includes("work together")) {
    return "You can reach Vansh directly via email at itsme@vanshkumar.in, connect on GitHub (github.com/DROPTASK), or leave a message right here in this chat guestbook. He checks messages regularly!";
  }

  if (q.includes("hello") || q.includes("hi") || q.includes("hey") || q.includes("greetings")) {
    return "Hey there! Thanks for visiting Vansh's portfolio. I'm his AI assistant. Feel free to ask about his projects like AnonRoom or JeeFlow, tech stack, movies, or drop a message for him!";
  }

  if (q.includes("game") || q.includes("bollywood") || q.includes("arcade")) {
    return "Check out the Games Lounge in the portfolio! Vansh built a Bollywood movie guessing game with both solo and live multiplayer rooms, plus classic Tic-Tac-Toe and Rock Paper Scissors.";
  }

  if (q.includes("music") || q.includes("song") || q.includes("lofi")) {
    return "The top bar includes a retro sound switch to play soothing background lofi while exploring the portfolio. You can toggle it anytime!";
  }

  if (q.includes("movie") || q.includes("film") || q.includes("cinephile")) {
    return "Vansh is a cinephile — check out the Movie Hub for his trending picks, top rated films, and favorites!";
  }

  return "Thanks for your message! Vansh is currently a Class 12 CS student following CBSE, while building projects like AnonRoom and JeeFlow. Your message has been saved in the guestbook, and he'll see it as well!";
}

/**
 * Calls the Supabase Edge Function `ai-reply`.
 * If the edge function is not deployed yet or returns an error,
 * falls back to the built-in intelligent portfolio knowledge responder.
 */
export async function getAIReply(
  userMessage: string,
  conversationHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke("ai-reply", {
      body: {
        message: userMessage,
        history: conversationHistory,
      },
    });

    if (!error && data?.reply?.trim()) {
      return data.reply.trim();
    }
  } catch (err) {
    console.warn("Edge function not reachable, using built-in assistant:", err);
  }

  // Graceful fallback to built-in knowledge engine
  return getBuiltinPortfolioReply(userMessage);
}
