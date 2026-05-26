"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Producto = {
  id: number;
  nombre: string;
  stock: number;
  stock_minimo: number;
  categoria: string;
  categoria_id: number;
  creado_por: string;
  imagen: string;
  imagen_public_id: string;
};

type Categoria = { id: number; nombre: string };
type Talla = { id?: number; talla: string; cantidad: number };

export default function Inventario() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [subiendo, setSubiendo] = useState(false);

  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [productoEliminar, setProductoEliminar] = useState<Producto | null>(null);
  const [productoEditar, setProductoEditar] = useState<Producto | null>(null);

  const [form, setForm] = useState({ nombre: "", stock: 0, stock_minimo: 0, categoria_id: 0 });
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState("");
  const [tallas, setTallas] = useState<Talla[]>([]);
  const [nuevaTalla, setNuevaTalla] = useState({ talla: "", cantidad: 0 });

  const [imagenEditFile, setImagenEditFile] = useState<File | null>(null);
  const [imagenEditPreview, setImagenEditPreview] = useState("");
  const [tallasEditar, setTallasEditar] = useState<Talla[]>([]);
  const [nuevaTallaEditar, setNuevaTallaEditar] = useState({ talla: "", cantidad: 0 });

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) { router.push("/"); return; }
    cargarProductos();
    cargarCategorias();
  }, []);

  async function cargarProductos() {
    const res = await fetch("/api/productos");
    const data = await res.json();
    setProductos(data);
    setLoading(false);
  }

  async function cargarCategorias() {
    const res = await fetch("/api/categorias");
    const data = await res.json();
    setCategorias(data);
  }

  async function cargarTallas(producto_id: number) {
    const res = await fetch(`/api/tallas?producto_id=${producto_id}`);
    const data = await res.json();
    setTallasEditar(data);
  }

  async function subirImagen(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    return await res.json();
  }

  async function crearProducto() {
    setSubiendo(true);
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    let imagen = null;
    let imagen_public_id = null;

    if (imagenFile) {
      const upload = await subirImagen(imagenFile);
      imagen = upload.url;
      imagen_public_id = upload.public_id;
    }

    const res = await fetch("/api/productos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, imagen, imagen_public_id, creado_por: user.id }),
    });
    const data = await res.json();

    for (const t of tallas) {
      await fetch("/api/tallas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ producto_id: data.id, talla: t.talla, cantidad: t.cantidad }),
      });
    }

    setSubiendo(false);
    setModalNuevo(false);
    setForm({ nombre: "", stock: 0, stock_minimo: 0, categoria_id: 0 });
    setImagenFile(null);
    setImagenPreview("");
    setTallas([]);
    cargarProductos();
  }

  async function editarProducto() {
    if (!productoEditar) return;
    setSubiendo(true);

    let imagen = productoEditar.imagen;
    let imagen_public_id = productoEditar.imagen_public_id;

    if (imagenEditFile) {
      if (imagen_public_id) {
        await fetch("/api/upload", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_id: imagen_public_id }),
        });
      }
      const upload = await subirImagen(imagenEditFile);
      imagen = upload.url;
      imagen_public_id = upload.public_id;
    }

    await fetch("/api/productos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...productoEditar, imagen, imagen_public_id }),
    });

    for (const t of tallasEditar) {
      if (!t.id) {
        await fetch("/api/tallas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ producto_id: productoEditar.id, talla: t.talla, cantidad: t.cantidad }),
        });
      } else {
        await fetch("/api/tallas", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: t.id, cantidad: t.cantidad }),
        });
      }
    }

    setSubiendo(false);
    setModalEditar(false);
    setProductoEditar(null);
    setImagenEditFile(null);
    setImagenEditPreview("");
    setTallasEditar([]);
    cargarProductos();
  }

  async function confirmarEliminar() {
    if (!productoEliminar) return;
    if (productoEliminar.imagen_public_id) {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id: productoEliminar.imagen_public_id }),
      });
    }
    await fetch("/api/productos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: productoEliminar.id }),
    });
    setModalEliminar(false);
    setProductoEliminar(null);
    cargarProductos();
  }

  async function eliminarTalla(id: number) {
    await fetch("/api/tallas", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setTallasEditar(tallasEditar.filter((t) => t.id !== id));
  }

  function cerrarSesion() {
    localStorage.clear();
    router.push("/");
  }

  const inputStyle = {
    border: "1px solid #dc2626",
    borderRadius: "8px",
    padding: "10px 12px",
    fontSize: "16px",
    color: "white",
    backgroundColor: "#1a1a1a",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  const btnRed = { backgroundColor: "#dc2626", color: "white", padding: "12px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "15px", flex: 1 };
  const btnGray = { backgroundColor: "#2a2a2a", color: "white", padding: "12px", borderRadius: "8px", border: "1px solid #444", cursor: "pointer", fontSize: "15px", flex: 1 };
  const btnBlue = { backgroundColor: "#2563eb", color: "white", padding: "12px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "15px", flex: 1 };
  const modalOverlay = { position: "fixed" as const, inset: 0, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 };
  const modalBox = (border: string) => ({ backgroundColor: "#111111", borderRadius: "20px 20px 0 0", padding: "24px", width: "100%", maxWidth: "500px", border: `1px solid ${border}`, maxHeight: "90vh", overflowY: "auto" as const });

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", paddingBottom: "100px" }}>

      {/* Header */}
      <div style={{ backgroundColor: "#111", borderBottom: "1px solid #dc2626", padding: "16px", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: "18px", fontWeight: "bold", color: "white", margin: 0 }}>
             <span style={{ color: "#dc2626" }}>INVENTARIO VALERO STOREE</span>
          </h1>
          <button onClick={() => setModalNuevo(true)} style={{ backgroundColor: "#dc2626", color: "white", padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "bold" }}>
            + NUEVO
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding: "16px" }}>
        {loading ? (
          <p style={{ color: "#dc2626", textAlign: "center", marginTop: "40px" }}>Cargando...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {productos.map((p) => (
              <div key={p.id} style={{ backgroundColor: "#111", borderRadius: "12px", border: "1px solid #222", overflow: "hidden" }}>
                <div style={{ display: "flex", gap: "12px", padding: "12px" }}>
                  {/* Imagen */}
                  <div style={{ flexShrink: 0 }}>
                    {p.imagen ? (
                      <img src={p.imagen} alt={p.nombre} style={{ width: "70px", height: "70px", objectFit: "cover", borderRadius: "10px", border: "1px solid #333" }} />
                    ) : (
                      <div style={{ width: "70px", height: "70px", backgroundColor: "#1a1a1a", borderRadius: "10px", border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}></div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "white", fontWeight: "700", fontSize: "16px", margin: "0 0 4px" }}>{p.nombre}</p>
                    <p style={{ color: "#9ca3af", fontSize: "13px", margin: "0 0 6px" }}>{p.categoria || "Sin categoría"}</p>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span style={{ color: p.stock <= p.stock_minimo ? "#ef4444" : "#4ade80", fontWeight: "bold", fontSize: "15px" }}>
                        {p.stock} uds
                      </span>
                      {p.stock <= p.stock_minimo && (
                        <span style={{ fontSize: "11px", backgroundColor: "#450a0a", color: "#f87171", padding: "2px 8px", borderRadius: "999px" }}>
                          ⚠ Stock bajo
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div style={{ display: "flex", borderTop: "1px solid #1f1f1f" }}>
                  <button
                    onClick={() => { setProductoEditar(p); setImagenEditPreview(p.imagen || ""); cargarTallas(p.id); setModalEditar(true); }}
                    style={{ flex: 1, padding: "12px", backgroundColor: "transparent", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}
                  >
                    ✏️ EDITAR
                  </button>
                  <div style={{ width: "1px", backgroundColor: "#1f1f1f" }} />
                  <button
                    onClick={() => { setProductoEliminar(p); setModalEliminar(true); }}
                    style={{ flex: 1, padding: "12px", backgroundColor: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}
                  >
                    🗑️ ELIMINAR
                  </button>
                </div>
              </div>
            ))}
            {productos.length === 0 && (
              <p style={{ textAlign: "center", color: "#4b5563", padding: "40px" }}>No hay productos aún</p>
            )}
          </div>
        )}
      </div>

      {/* Barra navegación inferior */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: "#111", borderTop: "1px solid #222", display: "flex", zIndex: 40 }}>
        {[
          { label: "INVENTARIO", path: "/inventario" },
          { label: "MOVIMIENTOS", path: "/movimientos" },
          { label: "CATEGORIAS", path: "/categorias" },
          { label: "USUARIOS", path: "/usuarios" },
        ].map((item) => (
          <button key={item.path} onClick={() => router.push(item.path)} style={{ flex: 1, padding: "12px 4px", backgroundColor: "transparent", border: "none", color: item.path === "/inventario" ? "#dc2626" : "#9ca3af", cursor: "pointer", fontSize: "11px", fontWeight: item.path === "/inventario" ? "700" : "400" }}>
            {item.label}
          </button>
        ))}
        <button onClick={cerrarSesion} style={{ flex: 1, padding: "12px 4px", backgroundColor: "transparent", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "11px" }}>
          SALIR
        </button>
      </div>

      {/* Modal eliminar */}
      {modalEliminar && productoEliminar && (
        <div style={modalOverlay}>
          <div style={modalBox("#dc2626")}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "white", marginBottom: "12px" }}>🗑️ Eliminar producto</h2>
            <p style={{ color: "#9ca3af", marginBottom: "20px" }}>
              ¿Eliminar <span style={{ color: "white", fontWeight: "bold" }}>{productoEliminar.nombre}</span>? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={confirmarEliminar} style={btnRed}>Sí, eliminar</button>
              <button onClick={() => { setModalEliminar(false); setProductoEliminar(null); }} style={btnGray}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo producto */}
      {modalNuevo && (
        <div style={modalOverlay}>
          <div style={modalBox("#dc2626")}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "white" }}>+ Nuevo <span style={{ color: "#dc2626" }}>producto</span></h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input placeholder="Nombre del producto" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Stock inicial" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} style={inputStyle} />
              <input type="number" placeholder="Stock mínimo" value={form.stock_minimo} onChange={(e) => setForm({ ...form, stock_minimo: Number(e.target.value) })} style={inputStyle} />
              <select value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: Number(e.target.value) })} style={inputStyle}>
                <option value={0}>Sin categoría</option>
                {categorias.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
              </select>

              <div style={{ borderTop: "1px solid #222", paddingTop: "12px" }}>
                <p style={{ color: "#dc2626", fontSize: "13px", marginBottom: "8px", fontWeight: "600" }}>Tallas</p>
                {tallas.map((t, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#1a1a1a", padding: "8px 12px", borderRadius: "8px", marginBottom: "6px" }}>
                    <span style={{ color: "white" }}>{t.talla}</span>
                    <span style={{ color: "#4ade80" }}>{t.cantidad} uds</span>
                    <button onClick={() => setTallas(tallas.filter((_, j) => j !== i))} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>✕</button>
                  </div>
                ))}
                <div style={{ display: "flex", gap: "8px" }}>
                  <input placeholder="Talla" value={nuevaTalla.talla} onChange={(e) => setNuevaTalla({ ...nuevaTalla, talla: e.target.value })} style={{ ...inputStyle, width: "45%" }} />
                  <input type="number" placeholder="Cantidad" value={nuevaTalla.cantidad} onChange={(e) => setNuevaTalla({ ...nuevaTalla, cantidad: Number(e.target.value) })} style={{ ...inputStyle, width: "30%" }} />
                  <button onClick={() => { if (!nuevaTalla.talla) return; setTallas([...tallas, nuevaTalla]); setNuevaTalla({ talla: "", cantidad: 0 }); }} style={{ backgroundColor: "#dc2626", color: "white", padding: "10px 12px", borderRadius: "8px", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>+ Add</button>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #222", paddingTop: "12px" }}>
                <p style={{ color: "#dc2626", fontSize: "13px", marginBottom: "8px", fontWeight: "600" }}>Foto del producto</p>
                <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; setImagenFile(file); setImagenPreview(URL.createObjectURL(file)); }} style={{ ...inputStyle, padding: "8px" }} />
                {imagenPreview && <img src={imagenPreview} alt="preview" style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "8px", marginTop: "8px" }} />}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={crearProducto} disabled={subiendo} style={{ ...btnRed, opacity: subiendo ? 0.6 : 1 }}>{subiendo ? "Guardando..." : "Guardar"}</button>
                <button onClick={() => { setModalNuevo(false); setImagenFile(null); setImagenPreview(""); setTallas([]); }} style={btnGray}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar */}
      {modalEditar && productoEditar && (
        <div style={modalOverlay}>
          <div style={modalBox("#2563eb")}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "4px", color: "white" }}>✏️ Editar producto</h2>
            <p style={{ color: "#dc2626", fontWeight: "bold", marginBottom: "16px" }}>{productoEditar.nombre}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input placeholder="Nombre" value={productoEditar.nombre} onChange={(e) => setProductoEditar({ ...productoEditar, nombre: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Stock" value={productoEditar.stock} onChange={(e) => setProductoEditar({ ...productoEditar, stock: Number(e.target.value) })} style={inputStyle} />
              <input type="number" placeholder="Stock mínimo" value={productoEditar.stock_minimo} onChange={(e) => setProductoEditar({ ...productoEditar, stock_minimo: Number(e.target.value) })} style={inputStyle} />
              <select value={productoEditar.categoria_id} onChange={(e) => setProductoEditar({ ...productoEditar, categoria_id: Number(e.target.value) })} style={inputStyle}>
                <option value={0}>Sin categoría</option>
                {categorias.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
              </select>

              <div style={{ borderTop: "1px solid #222", paddingTop: "12px" }}>
                <p style={{ color: "#60a5fa", fontSize: "13px", marginBottom: "8px", fontWeight: "600" }}>Tallas</p>
                {tallasEditar.map((t, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#1a1a1a", padding: "8px 12px", borderRadius: "8px", marginBottom: "6px" }}>
                    <span style={{ color: "white" }}>{t.talla}</span>
                    <input type="number" value={t.cantidad} onChange={(e) => { const updated = [...tallasEditar]; updated[i].cantidad = Number(e.target.value); setTallasEditar(updated); }} style={{ ...inputStyle, width: "80px", padding: "6px 8px" }} />
                    {t.id && <button onClick={() => eliminarTalla(t.id!)} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>✕</button>}
                  </div>
                ))}
                <div style={{ display: "flex", gap: "8px" }}>
                  <input placeholder="Talla" value={nuevaTallaEditar.talla} onChange={(e) => setNuevaTallaEditar({ ...nuevaTallaEditar, talla: e.target.value })} style={{ ...inputStyle, width: "45%" }} />
                  <input type="number" placeholder="Cantidad" value={nuevaTallaEditar.cantidad} onChange={(e) => setNuevaTallaEditar({ ...nuevaTallaEditar, cantidad: Number(e.target.value) })} style={{ ...inputStyle, width: "30%" }} />
                  <button onClick={() => { if (!nuevaTallaEditar.talla) return; setTallasEditar([...tallasEditar, nuevaTallaEditar]); setNuevaTallaEditar({ talla: "", cantidad: 0 }); }} style={{ backgroundColor: "#2563eb", color: "white", padding: "10px 12px", borderRadius: "8px", border: "none", cursor: "pointer" }}>+ Add</button>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #222", paddingTop: "12px" }}>
                <p style={{ color: "#60a5fa", fontSize: "13px", marginBottom: "8px", fontWeight: "600" }}>Cambiar foto</p>
                <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; setImagenEditFile(file); setImagenEditPreview(URL.createObjectURL(file)); }} style={{ ...inputStyle, padding: "8px" }} />
                {imagenEditPreview && <img src={imagenEditPreview} alt="preview" style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "8px", marginTop: "8px" }} />}
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={editarProducto} disabled={subiendo} style={{ ...btnBlue, opacity: subiendo ? 0.6 : 1 }}>{subiendo ? "Guardando..." : "Guardar"}</button>
                <button onClick={() => { setModalEditar(false); setProductoEditar(null); setImagenEditFile(null); setImagenEditPreview(""); setTallasEditar([]); }} style={btnGray}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}