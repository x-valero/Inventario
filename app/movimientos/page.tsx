"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Movimiento = {
  id: number;
  tipo: "entrada" | "salida" | "ajuste";
  cantidad: number;
  nota: string;
  fecha: string;
  producto: string;
  usuario: string;
};

type Producto = {
  id: number;
  nombre: string;
};

export default function Movimientos() {
  const router = useRouter();
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ producto_id: 0, tipo: "entrada", cantidad: 1, nota: "" });

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) { router.push("/"); return; }
    cargarMovimientos();
    cargarProductos();
  }, []);

  async function cargarMovimientos() {
    const res = await fetch("/api/movimientos");
    const data = await res.json();
    setMovimientos(data);
    setLoading(false);
  }

  async function cargarProductos() {
    const res = await fetch("/api/productos");
    const data = await res.json();
    setProductos(data);
  }

  async function registrarMovimiento() {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!form.producto_id) { alert("Selecciona un producto"); return; }

    await fetch("/api/movimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, usuario_id: user.id }),
    });

    setModal(false);
    setForm({ producto_id: 0, tipo: "entrada", cantidad: 1, nota: "" });
    cargarMovimientos();
  }

  const inputStyle = {
    border: "1px solid #dc2626",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "14px",
    color: "white",
    backgroundColor: "#1a1a1a",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  function colorTipo(tipo: string) {
    if (tipo === "entrada") return "#4ade80";
    if (tipo === "salida") return "#f87171";
    return "#facc15";
  }

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", padding: "24px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", borderBottom: "1px solid #dc2626", paddingBottom: "16px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "white" }}>
            📋 <span style={{ color: "#dc2626" }}>MOVIMIENTOS</span>
          </h1>
          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setModal(true)}
              style={{ backgroundColor: "#dc2626", color: "white", padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer" }}
            >
              + REGISTRAR MOVIMIENTOS
            </button>
            <button
              onClick={() => router.push("/inventario")}
              style={{ backgroundColor: "#1a1a1a", color: "white", padding: "8px 16px", borderRadius: "8px", border: "1px solid #444", cursor: "pointer" }}
            >
              ← Volver
            </button>
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <p style={{ color: "#dc2626" }}>CARGANDO...</p>
        ) : (
          <div style={{ backgroundColor: "#111111", borderRadius: "12px", border: "1px solid #222", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead style={{ backgroundColor: "#1a1a1a" }}>
                <tr>
                  {["Fecha", "Producto", "Tipo", "Cantidad", "Nota", "Usuario"].map((h) => (
                    <th key={h} style={{ padding: "14px 16px", textAlign: "left", color: "#dc2626", fontWeight: "600" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m) => (
                  <tr key={m.id} style={{ borderTop: "1px solid #1f1f1f" }}>
                    <td style={{ padding: "12px 16px", color: "#9ca3af", fontSize: "12px" }}>
                      {new Date(m.fecha).toLocaleString("es-CO")}
                    </td>
                    <td style={{ padding: "12px 16px", color: "white", fontWeight: "500" }}>{m.producto}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ color: colorTipo(m.tipo), fontWeight: "bold", textTransform: "capitalize" }}>
                        {m.tipo === "entrada" ? "↑" : m.tipo === "salida" ? "↓" : "⟳"} {m.tipo}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "white" }}>{m.cantidad}</td>
                    <td style={{ padding: "12px 16px", color: "#9ca3af" }}>{m.nota || "—"}</td>
                    <td style={{ padding: "12px 16px", color: "#9ca3af" }}>{m.usuario}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {movimientos.length === 0 && (
              <p style={{ textAlign: "center", color: "#4b5563", padding: "32px" }}>NO HAY MOVIMIENTOS AUN</p>
            )}
          </div>
        )}
      </div>

      {/* Modal registrar movimiento */}
      {modal && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ backgroundColor: "#111111", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "380px", border: "1px solid #dc2626" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "white" }}>
              + Registrar <span style={{ color: "#dc2626" }}>movimiento</span>
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <select value={form.producto_id} onChange={(e) => setForm({ ...form, producto_id: Number(e.target.value) })} style={inputStyle}>
                <option value={0}>SELECCIONA UN PRODUCTO</option>
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} style={inputStyle}>
                <option value="entrada">↑ ENTRADA</option>
                <option value="salida"> SALIDA</option>
                <option value="ajuste">⟳ AJUSTES</option>
              </select>
              <input
                type="number"
                placeholder="Cantidad"
                value={form.cantidad}
                min={1}
                onChange={(e) => setForm({ ...form, cantidad: Number(e.target.value) })}
                style={inputStyle}
              />
              <input
                placeholder="Nota (opcional)"
                value={form.nota}
                onChange={(e) => setForm({ ...form, nota: e.target.value })}
                style={inputStyle}
              />
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button onClick={registrarMovimiento} style={{ flex: 1, backgroundColor: "#dc2626", color: "white", padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer" }}>
                  GUARDAR
                </button>
                <button onClick={() => setModal(false)} style={{ flex: 1, backgroundColor: "#2a2a2a", color: "white", padding: "10px", borderRadius: "8px", border: "1px solid #444", cursor: "pointer" }}>
                  CANCELAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}