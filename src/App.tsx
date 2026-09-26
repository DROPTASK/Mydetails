import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { ShortLinkResolver } from "./pages/ShortLinkResolver";
import { MusicProvider } from "./lib/musicStore";

// Everything below is lazy-loaded so a visit to a short link (":slug") only
// ever downloads Home + ShortLinkResolver, never the games/chat/admin bundles.
const About = lazy(() => import("./pages/About").then((m) => ({ default: m.About })));
const Apps = lazy(() => import("./pages/Apps").then((m) => ({ default: m.Apps })));
const Interests = lazy(() => import("./pages/Interests").then((m) => ({ default: m.Interests })));
const Gallery = lazy(() => import("./pages/Gallery").then((m) => ({ default: m.Gallery })));
const Links = lazy(() => import("./pages/Links").then((m) => ({ default: m.Links })));
const Movies = lazy(() => import("./pages/Movies").then((m) => ({ default: m.Movies })));
const Games = lazy(() => import("./pages/Games").then((m) => ({ default: m.Games })));
const Bollywood = lazy(() => import("./pages/games/Bollywood").then((m) => ({ default: m.Bollywood })));
const BollywoodSolo = lazy(() => import("./pages/games/Bollywood").then((m) => ({ default: m.BollywoodSolo })));
const BollywoodRoom = lazy(() => import("./pages/games/BollywoodRoom").then((m) => ({ default: m.BollywoodRoom })));
const TicTacToe = lazy(() => import("./pages/games/TicTacToe").then((m) => ({ default: m.TicTacToe })));
const RockPaperScissors = lazy(() => import("./pages/games/RockPaperScissors").then((m) => ({ default: m.RockPaperScissors })));
const Chat = lazy(() => import("./pages/Chat").then((m) => ({ default: m.Chat })));
const Admin = lazy(() => import("./pages/Admin").then((m) => ({ default: m.Admin })));
const Shortener = lazy(() => import("./pages/Shortener").then((m) => ({ default: m.Shortener })));

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

function RouteFallback() {
  return null;
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
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/*" element={<Admin />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <Routes>
      {/* Short links resolve outside the app shell (no header/dock/music/animations)
          so the redirect fires the instant the destination URL is known. */}
      <Route path=":slug" element={<ShortLinkResolver />} />

      <Route
        element={
          <MusicProvider>
            <Layout />
          </MusicProvider>
        }
      >
        <Route index element={<Home />} />
        <Route path="about" element={<Suspense fallback={<RouteFallback />}><About /></Suspense>} />
        <Route path="apps" element={<Suspense fallback={<RouteFallback />}><Apps /></Suspense>} />
        <Route path="movies" element={<Suspense fallback={<RouteFallback />}><Movies /></Suspense>} />
        <Route path="games" element={<Suspense fallback={<RouteFallback />}><Games /></Suspense>} />
        <Route path="games/bollywood" element={<Suspense fallback={<RouteFallback />}><Bollywood /></Suspense>} />
        <Route path="games/bollywood/solo" element={<Suspense fallback={<RouteFallback />}><BollywoodSolo /></Suspense>} />
        <Route path="games/bollywood/multiplayer" element={<Suspense fallback={<RouteFallback />}><Bollywood /></Suspense>} />
        <Route path="games/bollywood/room/:code" element={<Suspense fallback={<RouteFallback />}><BollywoodRoom /></Suspense>} />
        <Route path="games/tic-tac-toe" element={<Suspense fallback={<RouteFallback />}><TicTacToe /></Suspense>} />
        <Route path="games/rock-paper-scissors" element={<Suspense fallback={<RouteFallback />}><RockPaperScissors /></Suspense>} />
        <Route path="interests" element={<Suspense fallback={<RouteFallback />}><Interests /></Suspense>} />
        <Route path="gallery" element={<Suspense fallback={<RouteFallback />}><Gallery /></Suspense>} />
        <Route path="links" element={<Suspense fallback={<RouteFallback />}><Links /></Suspense>} />
        <Route path="misc" element={<Navigate to="/links" replace />} />
        <Route path="miscellaneous" element={<Navigate to="/links" replace />} />
        <Route path="shortener" element={<Suspense fallback={<RouteFallback />}><Shortener /></Suspense>} />
        <Route path="chat" element={<Suspense fallback={<RouteFallback />}><Chat /></Suspense>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
