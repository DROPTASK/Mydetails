import { StrictMode, Component, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: "-apple-system, Inter, system-ui", color: "#f5f5f7", background: "#000", minHeight: "100vh" }}>
          <h1 style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>Something went wrong</h1>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              background: "#1c1c1e",
              padding: 16,
              borderRadius: 16,
              marginTop: 16,
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
          <p style={{ marginTop: 16, color: "#98989d" }}>
            Open the browser console (F12) for more details. Common fix: delete node_modules and run npm install again.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById("root");
if (!root) {
  document.body.innerHTML = "<p style='padding:2rem;color:red'>#root element missing</p>";
} else {
  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}
