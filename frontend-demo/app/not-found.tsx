import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F9FCF7",
        color: "#1a2e1f",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        fontFamily: "Inter, system-ui, sans-serif",
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 600 }}>404</h1>
      <p style={{ color: "#5a7d64" }}>Esta página no existe.</p>
      <Link
        href="/"
        style={{
          color: "#3f7a63",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Volver al inicio
      </Link>
    </div>
  );
}
