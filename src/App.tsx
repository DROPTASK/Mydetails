import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { Apps } from "./pages/Apps";
import { Interests } from "./pages/Interests";
import { Gallery } from "./pages/Gallery";
import { Links } from "./pages/Links";
import { Movies } from "./pages/Movies";
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
  const isLocalDev = hostname === "localhost" || hostname === "127.0.0.1";

  if (isAdminHost || (isLocalDev && pathname.startsWith("/admin"))) {
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
