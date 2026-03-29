"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Evita pantalla en blanco si Wagmi/RainbowKit u otro hijo revienta en el cliente.
 */
export class ClientErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[StrongBox] Error en cliente:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            padding: 24,
            background: "#eef1ef",
            color: "#0f1712",
            fontFamily: "system-ui, sans-serif",
            maxWidth: 520,
          }}
        >
          <h1 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            No se pudo cargar la aplicación
          </h1>
          <p style={{ fontSize: 14, color: "#3d4f45", lineHeight: 1.5 }}>
            Probá recargar la página con Ctrl+F5. Si usás una extensión de
            wallet o bloqueador, desactivalo un momento para esta URL.
          </p>
          <pre
            style={{
              marginTop: 16,
              padding: 12,
              background: "#fff",
              border: "1px solid #dce3de",
              borderRadius: 8,
              fontSize: 12,
              overflow: "auto",
              color: "#7f1d1d",
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
              background: "#2d6b4f",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Recargar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
