"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Categoria = {
  id: number;
  nombre: string;
  creado_en: string;
};

export default function Categorias() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) { router.push("/"); return; }
    cargarCategorias();
  }, []);

  async function cargarCategorias() {
    const res = await fetch("/api/categorias");
    const data = await res.json();
    setCategorias(data);
    setLoading(false);
  }

  async function crearCategoria() {
    if (!nombre.trim()) { setError("Escribe un nombre"); return; }
    setError("");

    const res = await fetch("/api/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre }),
    });

    if (!res.ok) {
      setError("Ya existe una categoría con ese nombre");
      return;
    }

    setNombre("");
    cargarCategorias();
  }

  async function eliminarCategoria(id: number) {
    if (!confirm("¿Eliminar esta categoría?")) return;
    await fetch("/api/categorias", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    cargarCategorias();
  }

  const inputStyle = {
    border: "1px solid #dc2626",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "14px",
    color: "white",
    backgroundColor: "#1a1a1a",
    outline: "none",
    flex: 1,
  };

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", padding: "24px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", borderBottom: "1px solid #dc2626", paddingBottom: "16px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "white" }}>
            🏷️ <span style={{ color: "#dc2626" }}>CATEGORIAS</span>
          </h1>
          <button
            onClick={() => router.push("/inventario")}
            style={{ backgroundColor: "#1a1a1a", color: "white", padding: "8px 16px", borderRadius: "8px", border: "1px solid #444", cursor: "pointer" }}
          >
            ← VOLVER
          </button>
        </div>

        {/* Formulario nueva categoría */}
        <div style={{ backgroundColor: "#111111", borderRadius: "12px", padding: "20px", border: "1px solid #222", marginBottom: "24px" }}>
          <h2 style={{ color: "white", fontSize: "16px", marginBottom: "12px" }}>Nueva categoría</h2>
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              placeholder="Nombre de la categoría"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && crearCategoria()}
              style={inputStyle}
            />
            <button
              onClick={crearCategoria}
              style={{ backgroundColor: "#dc2626", color: "white", padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "14px", whiteSpace: "nowrap" }}
            >
              + AGREGAR
            </button>
          </div>
          {error && <p style={{ color: "#f87171", fontSize: "13px", marginTop: "8px" }}>{error}</p>}
        </div>

        {/* Lista de categorías */}
        {loading ? (
          <p style={{ color: "#dc2626" }}>CARGANDO...</p>
        ) : (
          <div style={{ backgroundColor: "#111111", borderRadius: "12px", border: "1px solid #222", overflow: "hidden" }}>
            {categorias.length === 0 ? (
              <p style={{ textAlign: "center", color: "#4b5563", padding: "32px" }}>NO HAY CATEGORIAS AUN</p>
            ) : (
              categorias.map((c) => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderBottom: "1px solid #1f1f1f" }}>
                  <div>
                    <p style={{ color: "white", fontWeight: "500", margin: 0 }}>{c.nombre}</p>
                    <p style={{ color: "#4b5563", fontSize: "12px", margin: 0 }}>
                      {new Date(c.creado_en).toLocaleDateString("es-CO")}
                    </p>
                  </div>
                  <button
                    onClick={() => eliminarCategoria(c.id)}
                    style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: "13px" }}
                  >
                    ELIMINAR
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}