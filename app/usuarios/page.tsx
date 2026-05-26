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
    border: "1px solid #48484a",
    borderRadius: "10px",
    padding: "12px",
    fontSize: "16px",
    color: "white",
    backgroundColor: "#3a3a3c",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  const modalOverlay = { position: "fixed" as const, inset: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 };
  const modalBox = (border: string) => ({ backgroundColor: "#2c2c2e", borderRadius: "20px 20px 0 0", padding: "24px", width: "100%", maxWidth: "500px", border: `1px solid ${border}`, maxHeight: "90vh", overflowY: "auto" as const });

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#1c1c1e", paddingBottom: "80px" }}>

      {/* Header */}
      <div style={{ backgroundColor: "#2c2c2e", borderBottom: "1px solid #dc2626", padding: "16px", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: "18px", fontWeight: "800", color: "white", margin: 0 }}>
            👤 <span style={{ color: "#dc2626" }}>Usuarios</span>
          </h1>
          <button onClick={() => setModal(true)} style={{ backgroundColor: "#dc2626", color: "white", padding: "8px 16px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "700" }}>
            + Nuevo
          </button>
        </div>
      </div>

      {/* Lista */}
      <div style={{ padding: "16px" }}>
        {loading ? (
          <p style={{ color: "#dc2626", textAlign: "center", marginTop: "40px" }}>Cargando...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {usuarios.map((u) => (
              <div key={u.id} style={{ backgroundColor: "#2c2c2e", borderRadius: "14px", border: "1px solid #3a3a3c", overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px" }}>
                  <div style={{ width: "48px", height: "48px", backgroundColor: "#dc2626", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", fontWeight: "800", color: "white", flexShrink: 0 }}>
                    {u.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "white", fontWeight: "700", margin: "0 0 2px", fontSize: "16px" }}>{u.nombre}</p>
                    <p style={{ color: "#8e8e93", fontSize: "13px", margin: 0 }}>{u.email}</p>
                  </div>
                  <span style={{ backgroundColor: u.rol === "admin" ? "#3a0a0a" : "#0a2a0a", color: u.rol === "admin" ? "#ff453a" : "#30d158", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "700" }}>
                    {u.rol}
                  </span>
                </div>
                <div style={{ borderTop: "1px solid #3a3a3c" }}>
                  <button
                    onClick={() => { setUsuarioEliminar(u); setModalEliminar(true); }}
                    style={{ width: "100%", padding: "12px", backgroundColor: "transparent", border: "none", color: "#ff453a", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}
                  >
                    🗑️ Eliminar usuario
                  </button>
                </div>
              </div>
            ))}
            {usuarios.length === 0 && (
              <p style={{ textAlign: "center", color: "#8e8e93", padding: "40px" }}>No hay usuarios</p>
            )}
          </div>
        )}
      </div>

      {/* Nav inferior */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: "#2c2c2e", borderTop: "1px solid #3a3a3c", display: "flex", zIndex: 40 }}>
        {[
          { label: "📦 Inicio", path: "/inventario" },
          { label: "📋 Movimientos", path: "/movimientos" },
          { label: "🏷️ Categorías", path: "/categorias" },
          { label: "👤 Usuarios", path: "/usuarios" },
        ].map((item) => (
          <button key={item.path} onClick={() => router.push(item.path)} style={{ flex: 1, padding: "12px 4px", backgroundColor: "transparent", border: "none", color: item.path === "/usuarios" ? "#dc2626" : "#8e8e93", cursor: "pointer", fontSize: "11px", fontWeight: item.path === "/usuarios" ? "700" : "400" }}>
            {item.label}
          </button>
        ))}
        <button onClick={() => { localStorage.clear(); router.push("/"); }} style={{ flex: 1, padding: "12px 4px", backgroundColor: "transparent", border: "none", color: "#8e8e93", cursor: "pointer", fontSize: "11px" }}>
          🚪 Salir
        </button>
      </div>

      {/* Modal nuevo usuario */}
      {modal && (
        <div style={modalOverlay}>
          <div style={modalBox("#dc2626")}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px", color: "white" }}>
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
              {error && <p style={{ color: "#ff453a", fontSize: "13px", margin: 0 }}>⚠️ {error}</p>}
              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button onClick={crearUsuario} disabled={guardando} style={{ flex: 1, backgroundColor: "#dc2626", color: "white", padding: "14px", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "700", fontSize: "15px" }}>
                  {guardando ? "Guardando..." : "Guardar"}
                </button>
                <button onClick={() => { setModal(false); setError(""); setForm({ nombre: "", email: "", password: "", rol: "admin" }); }} style={{ flex: 1, backgroundColor: "#3a3a3c", color: "white", padding: "14px", borderRadius: "12px", border: "1px solid #48484a", cursor: "pointer", fontSize: "15px" }}>
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
          <div style={modalBox("#ff453a")}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "white", marginBottom: "12px" }}>🗑️ Eliminar usuario</h2>
            <p style={{ color: "#8e8e93", marginBottom: "20px" }}>
              ¿Seguro que quieres eliminar a <span style={{ color: "white", fontWeight: "700" }}>{usuarioEliminar.nombre}</span>?
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={confirmarEliminar} style={{ flex: 1, backgroundColor: "#dc2626", color: "white", padding: "14px", borderRadius: "12px", border: "none", cursor: "pointer", fontWeight: "700" }}>Sí, eliminar</button>
              <button onClick={() => { setModalEliminar(false); setUsuarioEliminar(null); }} style={{ flex: 1, backgroundColor: "#3a3a3c", color: "white", padding: "14px", borderRadius: "12px", border: "1px solid #48484a", cursor: "pointer" }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}