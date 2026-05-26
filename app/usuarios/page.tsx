"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Usuario = {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  creado_en: string;
};

export default function Usuarios() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [usuarioEliminar, setUsuarioEliminar] = useState<Usuario | null>(null);
  const [form, setForm] = useState({ nombre: "", email: "", password: "", rol: "admin" });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) { router.push("/"); return; }
    cargarUsuarios();
  }, []);

  async function cargarUsuarios() {
    const res = await fetch("/api/usuarios");
    const data = await res.json();
    setUsuarios(data);
    setLoading(false);
  }

  async function crearUsuario() {
    if (!form.nombre || !form.email || !form.password) {
      setError("Todos los campos son requeridos");
      return;
    }
    setGuardando(true);
    setError("");

    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setGuardando(false);

    if (!res.ok) {
      setError(data.error || "Error al crear usuario");
      return;
    }

    setModal(false);
    setForm({ nombre: "", email: "", password: "", rol: "admin" });
    cargarUsuarios();
  }

  async function confirmarEliminar() {
    if (!usuarioEliminar) return;
    await fetch("/api/usuarios", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: usuarioEliminar.id }),
    });
    setModalEliminar(false);
    setUsuarioEliminar(null);
    cargarUsuarios();
  }

  const inputStyle = {
    border: "1px solid #dc2626",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "14px",
    color: "white",
    backgroundColor: "#1a1a1a",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  const modalOverlay = { position: "fixed" as const, inset: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "16px" };
  const modalBox = (border: string) => ({ backgroundColor: "#111111", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "400px", border: `1px solid ${border}` });

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", padding: "24px", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", borderBottom: "1px solid #dc2626", paddingBottom: "16px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: "bold", color: "white" }}>
            👤 <span style={{ color: "#dc2626" }}>Usuarios</span>
          </h1>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setModal(true)} style={{ backgroundColor: "#dc2626", color: "white", padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600" }}>
              + Nuevo usuario
            </button>
            <button onClick={() => router.push("/inventario")} style={{ backgroundColor: "#1a1a1a", color: "white", padding: "8px 16px", borderRadius: "8px", border: "1px solid #444", cursor: "pointer" }}>
              ← Volver
            </button>
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <p style={{ color: "#dc2626" }}>Cargando...</p>
        ) : (
          <div style={{ backgroundColor: "#111111", borderRadius: "12px", border: "1px solid #222", overflow: "hidden" }}>
            {usuarios.map((u) => (
              <div key={u.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #1f1f1f" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ width: "42px", height: "42px", backgroundColor: "#dc2626", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "bold", color: "white" }}>
                    {u.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ color: "white", fontWeight: "600", margin: 0 }}>{u.nombre}</p>
                    <p style={{ color: "#4b5563", fontSize: "13px", margin: 0 }}>{u.email}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ backgroundColor: u.rol === "admin" ? "#450a0a" : "#1a2e1a", color: u.rol === "admin" ? "#f87171" : "#4ade80", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "600" }}>
                    {u.rol}
                  </span>
                  <button onClick={() => { setUsuarioEliminar(u); setModalEliminar(true); }} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: "13px" }}>
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
            {usuarios.length === 0 && (
              <p style={{ textAlign: "center", color: "#4b5563", padding: "32px" }}>No hay usuarios</p>
            )}
          </div>
        )}
      </div>

      {/* Modal nuevo usuario */}
      {modal && (
        <div style={modalOverlay}>
          <div style={modalBox("#dc2626")}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px", color: "white" }}>
              + Nuevo <span style={{ color: "#dc2626" }}>usuario</span>
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input placeholder="Nombre completo" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} style={inputStyle} />
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inputStyle} />
              <input type="password" placeholder="Contraseña" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={inputStyle} />
              <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })} style={inputStyle}>
                <option value="admin">Admin</option>
                <option value="empleado">Empleado</option>
              </select>
              {error && <p style={{ color: "#f87171", fontSize: "13px", margin: 0 }}>⚠️ {error}</p>}
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button onClick={crearUsuario} disabled={guardando} style={{ flex: 1, backgroundColor: "#dc2626", color: "white", padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer", fontWeight: "600" }}>
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
                <button onClick={() => { setModal(false); setError(""); setForm({ nombre: "", email: "", password: "", rol: "admin" }); }} style={{ flex: 1, backgroundColor: "#2a2a2a", color: "white", padding: "10px", borderRadius: "8px", border: "1px solid #444", cursor: "pointer" }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {modalEliminar && usuarioEliminar && (
        <div style={modalOverlay}>
          <div style={modalBox("#dc2626")}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "white", marginBottom: "12px" }}>🗑️ Eliminar usuario</h2>
            <p style={{ color: "#9ca3af", marginBottom: "20px" }}>
              ¿Seguro que quieres eliminar a <span style={{ color: "white", fontWeight: "bold" }}>{usuarioEliminar.nombre}</span>?
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={confirmarEliminar} style={{ flex: 1, backgroundColor: "#dc2626", color: "white", padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer" }}>Sí, eliminar</button>
              <button onClick={() => { setModalEliminar(false); setUsuarioEliminar(null); }} style={{ flex: 1, backgroundColor: "#2a2a2a", color: "white", padding: "10px", borderRadius: "8px", border: "1px solid #444", cursor: "pointer" }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}