import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#08090c",
        color: "#f0f1f4",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        fontFamily: "system-ui, sans-serif",
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 600 }}>404</h1>
      <p style={{ color: "#8b909c" }}>Esta página no existe.</p>
      <Link
        href="/"
        style={{
          color: "#8fb4c9",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Volver al inicio
      </Link>
    </div>
  );
}
