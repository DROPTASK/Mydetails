import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Apps } from "./pages/Apps";
import { Interests } from "./pages/Interests";
import { Gallery } from "./pages/Gallery";
import { Links } from "./pages/Links";
import { Movies } from "./pages/Movies";
import { Games } from "./pages/Games";
import { Bollywood, BollywoodSolo } from "./pages/games/Bollywood";
import { BollywoodRoom } from "./pages/games/BollywoodRoom";
import { TicTacToe } from "./pages/games/TicTacToe";
import { RockPaperScissors } from "./pages/games/RockPaperScissors";
import { Chat } from "./pages/Chat";
import { Admin } from "./pages/Admin";
import { MusicProvider } from "./lib/musicStore";

function getHostname() {
  try {
    return window.location.hostname;
  } catch {
    return "";
  }
}

function getPathname() {
  try {
    return window.location.pathname;
  } catch {
    return "/";
  }
}

/**
 * Subdomain routing:
 * - administrator.vanshkumar.in → Admin only
 * - localhost /admin → Admin (dev)
 * - everything else → public portfolio
 */
function AppRoutes() {
  const hostname = getHostname();
  const pathname = getPathname();
  const isAdminHost = hostname === "administrator.vanshkumar.in";
  const isLocalOrPreview =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.includes("run.app") ||
    hostname.includes("webcontainer") ||
    hostname.includes("google");

  if (isAdminHost || ((isLocalOrPreview || pathname.startsWith("/admin")) && pathname.startsWith("/admin"))) {
    return (
      <Routes>
        <Route path="/*" element={<Admin />} />
      </Routes>
    );
  }

  return (
    <MusicProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="apps" element={<Apps />} />
          <Route path="movies" element={<Movies />} />
          <Route path="games" element={<Games />} />
          <Route path="games/bollywood" element={<Bollywood />} />
          <Route path="games/bollywood/solo" element={<Bollywood />} />
          <Route path="games/bollywood/multiplayer" element={<Bollywood />} />
          <Route path="games/bollywood/room/:code" element={<BollywoodRoom />} />
          <Route path="games/tic-tac-toe" element={<TicTacToe />} />
          <Route path="games/rock-paper-scissors" element={<RockPaperScissors />} />
          <Route path="interests" element={<Interests />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="links" element={<Links />} />
          <Route path="chat" element={<Chat />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </MusicProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
