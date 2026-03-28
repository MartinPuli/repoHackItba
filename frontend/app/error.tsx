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
        fontFamily: "Inter, system-ui, sans-serif",
        backgroundColor: "#F9FCF7",
        color: "#1a2e1f",
      }}
    >
      <h1 style={{ fontSize: 18, fontWeight: 600, color: "#1a2e1f" }}>
        Algo salió mal
      </h1>
      <pre
        style={{
          marginTop: 12,
          color: "#d46b6b",
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
    </div>
  );
}
