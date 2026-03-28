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
          backgroundColor: "#08090c",
          color: "#f0f1f4",
          fontFamily: "system-ui, sans-serif",
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Error en la app</h1>
        <p style={{ color: "#8b909c", fontSize: 14, maxWidth: 480 }}>
          {error?.message || "Error desconocido"}
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 20,
            padding: "10px 16px",
            borderRadius: 10,
            border: "none",
            background: "#8fb4c9",
            color: "#0a0d10",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
