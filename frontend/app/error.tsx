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
        fontFamily: '"Outfit", system-ui, sans-serif',
        backgroundColor: "#f5f4f0",
        color: "#1a1a18",
      }}
    >
      <h1 style={{ fontSize: 18, fontWeight: 600, color: "#1a1a18" }}>
        Something went wrong
      </h1>
      <pre
        style={{
          marginTop: 12,
          color: "#d93025",
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
          background: "#1a7f5a",
          color: "#ffffff",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
