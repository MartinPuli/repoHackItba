"use client";

/**
 * Obligatorio para errores en el root layout.
 * Debe definir <html> y <body> (no comparte el layout raíz).
 * Sin esto, el dev server puede quedar en "missing required error components, refreshing...".
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          backgroundColor: "#F9FCF7",
          color: "#1a2e1f",
          fontFamily: "Inter, system-ui, sans-serif",
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Error en la app</h1>
        <p style={{ color: "#5a7d64", fontSize: 14, maxWidth: 480 }}>
          {error?.message || "Error desconocido"}
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 20,
            padding: "10px 16px",
            borderRadius: 12,
            border: "none",
            background: "#96CCA8",
            color: "#142822",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(150, 204, 168, 0.35)",
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
