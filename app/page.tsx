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
      backgroundColor: "#0a0a0a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      fontFamily: "system-ui, sans-serif"
    }}>
      {/* Fondo con efecto */}
      <div style={{
        position: "fixed",
        inset: 0,
        background: "radial-gradient(ellipse at top left, #1a0000 0%, #0a0a0a 50%, #000510 100%)",
        zIndex: 0
      }} />

      {/* Círculo decorativo rojo */}
      <div style={{
        position: "fixed",
        top: "-100px",
        right: "-100px",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(220,38,38,0.15) 0%, transparent 70%)",
        zIndex: 0
      }} />
      <div style={{
        position: "fixed",
        bottom: "-100px",
        left: "-100px",
        width: "400px",
        height: "400px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(220,38,38,0.08) 0%, transparent 70%)",
        zIndex: 0
      }} />

      {/* Card */}
      <div style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: "400px",
        backgroundColor: "#111111",
        borderRadius: "20px",
        padding: "40px 32px",
        border: "1px solid #1f1f1f",
        boxShadow: "0 0 40px rgba(220,38,38,0.1), 0 20px 60px rgba(0,0,0,0.5)"
      }}>

        {/* Logo / Icono */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "64px",
            height: "64px",
            backgroundColor: "#dc2626",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            margin: "0 auto 16px",
            boxShadow: "0 0 20px rgba(220,38,38,0.4)"
          }}>📦</div>
          <h1 style={{ color: "white", fontSize: "24px", fontWeight: "800", margin: 0, letterSpacing: "-0.5px" }}>
            INVENTARIO <span style={{ color: "#dc2626" }}>VALERO STOREE</span>
          </h1>
          <p style={{ color: "#4b5563", fontSize: "14px", marginTop: "6px" }}>
            INICIA SESION PARA CONTINUAR
          </p>
        </div>

        {/* Campos */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Email */}
          <div>
            <label style={{ color: "#9ca3af", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px", letterSpacing: "0.5px" }}>
              EMAIL
            </label>
            <input
              type="email"
              placeholder="CORREO ELECTRONICO"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              style={{
                width: "100%",
                backgroundColor: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: "10px",
                padding: "12px 16px",
                color: "white",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box" as const,
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = "#dc2626"}
              onBlur={(e) => e.target.style.borderColor = "#2a2a2a"}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ color: "#9ca3af", fontSize: "12px", fontWeight: "600", display: "block", marginBottom: "6px", letterSpacing: "0.5px" }}>
              CONTRASEÑA
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              style={{
                width: "100%",
                backgroundColor: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: "10px",
                padding: "12px 16px",
                color: "white",
                fontSize: "15px",
                outline: "none",
                boxSizing: "border-box" as const,
              }}
              onFocus={(e) => e.target.style.borderColor = "#dc2626"}
              onBlur={(e) => e.target.style.borderColor = "#2a2a2a"}
            />
          </div>

          {/* Error */}
          {error && (
            <div style={{
              backgroundColor: "#450a0a",
              border: "1px solid #dc2626",
              borderRadius: "10px",
              padding: "10px 14px",
              color: "#f87171",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Botón */}
          <button
            onClick={login}
            disabled={loading}
            style={{
              width: "100%",
              backgroundColor: loading ? "#7f1d1d" : "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "14px",
              fontSize: "15px",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "4px",
              letterSpacing: "0.5px",
              boxShadow: loading ? "none" : "0 0 20px rgba(220,38,38,0.3)",
              transition: "all 0.2s"
            }}
          >
            {loading ? "Iniciando sesión..." : "ENTRAR →"}
          </button>
        </div>

        {/* Footer */}
        <p style={{ color: "#2a2a2a", fontSize: "11px", textAlign: "center", marginTop: "24px" }}>
          © 2026 VALERO STOREE
        </p>
      </div>
    </main>
  );
}