"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Prevents blank screen if Wagmi/AppKit or any child crashes on the client.
 */
export class ClientErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Vaultix] Client error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            padding: 24,
            background: "#f5f4f0",
            color: "#1a1a18",
            fontFamily: '"Outfit", system-ui, sans-serif',
            maxWidth: 520,
          }}
        >
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            Could not load the application
          </h1>
          <p style={{ fontSize: 14, color: "#4a4a46", lineHeight: 1.5 }}>
            Try reloading the page with Ctrl+F5. If you use a wallet extension
            or ad blocker, try disabling it for this URL.
          </p>
          <pre
            style={{
              marginTop: 16,
              padding: 12,
              background: "#fff",
              border: "1px solid #e3e1dc",
              borderRadius: 8,
              fontSize: 12,
              overflow: "auto",
              color: "#d93025",
            }}
          >
            {this.state.error.message}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 20,
              padding: "10px 18px",
              borderRadius: 8,
              border: "none",
              background: "#1a7f5a",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
