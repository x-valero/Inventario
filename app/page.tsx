"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Login incorrecto");
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    router.push("/inventario");
  }

  return (
    <main style={{
      minHeight: "100vh",
      backgroundColor: "#1c1c1e",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
    }}>
      <div style={{
        position: "fixed",
        inset: 0,
        background: "radial-gradient(ellipse at top left, #2a0a0a 0%, #1c1c1e 50%, #0a0a1a 100%)",
        zIndex: 0
      }} />

      <div style={{
        position: "fixed",
        top: "-100px", right: "-100px",
        width: "400px", height: "400px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(220,38,38,0.12) 0%, transparent 70%)",
        zIndex: 0
      }} />

      <div style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: "400px",
        backgroundColor: "#2c2c2e",
        borderRadius: "20px",
        padding: "40px 32px",
        border: "1px solid #3a3a3c",
        boxShadow: "0 0 40px rgba(220,38,38,0.08), 0 20px 60px rgba(0,0,0,0.4)"
      }}>

        <div style={{ textAlign: "center", marginBottom: "32px" }}>
 <img
  src="/icon-192.png"
  alt="Valero Storee"
  style={{
    width: "90px",
    height: "90px",
    borderRadius: "22px",
    margin: "0 auto 16px",
    display: "block",
    boxShadow: "0 0 24px rgba(220,38,38,0.3)",
    border: "2px solid #dc2626"
  }}
/>
          <h1 style={{ color: "white", fontSize: "22px", fontWeight: "800", margin: "0 0 4px", letterSpacing: "-0.5px" }}>
            INVENTARIO <span style={{ color: "#dc2626" }}>VALERO STOREE</span>
          </h1>
          <p style={{ color: "#8e8e93", fontSize: "13px", margin: 0, letterSpacing: "0.5px" }}>
            INICIA SESIÓN PARA CONTINUAR
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ color: "#8e8e93", fontSize: "11px", fontWeight: "600", display: "block", marginBottom: "6px", letterSpacing: "1px" }}>EMAIL</label>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              style={{
                width: "100%",
                backgroundColor: "#3a3a3c",
                border: "1px solid #48484a",
                borderRadius: "12px",
                padding: "14px 16px",
                color: "white",
                fontSize: "16px",
                outline: "none",
                boxSizing: "border-box" as const,
              }}
              onFocus={(e) => e.target.style.borderColor = "#dc2626"}
              onBlur={(e) => e.target.style.borderColor = "#48484a"}
            />
          </div>

          <div>
            <label style={{ color: "#8e8e93", fontSize: "11px", fontWeight: "600", display: "block", marginBottom: "6px", letterSpacing: "1px" }}>CONTRASEÑA</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              style={{
                width: "100%",
                backgroundColor: "#3a3a3c",
                border: "1px solid #48484a",
                borderRadius: "12px",
                padding: "14px 16px",
                color: "white",
                fontSize: "16px",
                outline: "none",
                boxSizing: "border-box" as const,
              }}
              onFocus={(e) => e.target.style.borderColor = "#dc2626"}
              onBlur={(e) => e.target.style.borderColor = "#48484a"}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: "#3a0a0a",
              border: "1px solid #dc2626",
              borderRadius: "12px",
              padding: "12px 16px",
              color: "#f87171",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={login}
            disabled={loading}
            style={{
              width: "100%",
              backgroundColor: loading ? "#7f1d1d" : "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "15px",
              fontSize: "16px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "4px",
              letterSpacing: "0.5px",
              boxShadow: loading ? "none" : "0 4px 20px rgba(220,38,38,0.3)",
            }}
          >
            {loading ? "Iniciando sesión..." : "ENTRAR →"}
          </button>
        </div>

        <p style={{ color: "#48484a", fontSize: "11px", textAlign: "center", marginTop: "24px", letterSpacing: "1px" }}>
          © 2026 VALERO STOREE
        </p>
      </div>
    </main>
  );
}