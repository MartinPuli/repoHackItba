import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f4f0",
        color: "#1a1a18",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        fontFamily: '"Outfit", system-ui, sans-serif',
        padding: 24,
      }}
    >
      <h1 style={{ fontSize: 20, fontWeight: 600 }}>404</h1>
      <p style={{ color: "#4a4a46" }}>This page does not exist.</p>
      <Link
        href="/"
        style={{
          color: "#1a7f5a",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Back to home
      </Link>
    </div>
  );
}
