"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "60vh",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 18, fontWeight: 600, color: "#f0f1f4" }}>
        Algo salió mal
      </h1>
      <pre
        style={{
          marginTop: 12,
          color: "#b87a7a",
          whiteSpace: "pre-wrap",
          fontSize: 13,
        }}
      >
        {error.message}
      </pre>
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
    </div>
  );
}
