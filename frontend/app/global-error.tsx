"use client";

/**
 * Required for errors in the root layout.
 * Must define <html> and <body> (does not share root layout).
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
          backgroundColor: "#f5f4f0",
          color: "#1a1a18",
          fontFamily: '"Outfit", system-ui, sans-serif',
          padding: 24,
        }}
      >
        <h1 style={{ fontSize: 18, fontWeight: 600 }}>Application error</h1>
        <p style={{ color: "#4a4a46", fontSize: 14, maxWidth: 480 }}>
          {error?.message || "Unknown error"}
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 20,
            padding: "10px 16px",
            borderRadius: 12,
            border: "none",
            background: "#1a7f5a",
            color: "#ffffff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
