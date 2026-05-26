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
  const [productosFiltrados, setProductosFiltrados] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaActiva, setCategoriaActiva] = useState<number | null>(null);
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

  useEffect(() => {
    if (categoriaActiva === null) {
      setProductosFiltrados(productos);
    } else {
      setProductosFiltrados(productos.filter(p => p.categoria_id === categoriaActiva));
    }
  }, [categoriaActiva, productos]);

  async function cargarProductos() {
    const res = await fetch("/api/productos");
    const data = await res.json();
    setProductos(data);
    setProductosFiltrados(data);
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

  const btnRed = { backgroundColor: "#dc2626", color: "white", padding: "14px", borderRadius: "12px", border: "none", cursor: "pointer", fontSize: "15px", fontWeight: "600", flex: 1 };
  const btnGray = { backgroundColor: "#3a3a3c", color: "white", padding: "14px", borderRadius: "12px", border: "1px solid #48484a", cursor: "pointer", fontSize: "15px", flex: 1 };
  const btnBlue = { backgroundColor: "#0a84ff", color: "white", padding: "14px", borderRadius: "12px", border: "none", cursor: "pointer", fontSize: "15px", fontWeight: "600", flex: 1 };
  const modalOverlay = { position: "fixed" as const, inset: 0, backgroundColor: "rgba(0,0,0,0.75)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 };
  const modalBox = (border: string) => ({ backgroundColor: "#2c2c2e", borderRadius: "20px 20px 0 0", padding: "24px", width: "100%", maxWidth: "500px", border: `1px solid ${border}`, maxHeight: "90vh", overflowY: "auto" as const });

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#1c1c1e", paddingBottom: "80px" }}>

      {/* Header */}
      <div style={{ backgroundColor: "#2c2c2e", borderBottom: "1px solid #dc2626", padding: "16px", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
  <img src="/icon-192.png" alt="logo" style={{ width: "32px", height: "32px", borderRadius: "8px" }} />
  <h1 style={{ fontSize: "18px", fontWeight: "800", color: "white", margin: 0 }}>
    <span style={{ color: "#dc2626" }}>Inventario</span>
  </h1>
</div>
          <button onClick={() => setModalNuevo(true)} style={{ backgroundColor: "#dc2626", color: "white", padding: "8px 16px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: "700" }}>
            + Nuevo
          </button>
        </div>

        {/* Filtro por categorias */}
        <div style={{ display: "flex", gap: "8px", marginTop: "12px", overflowX: "auto", paddingBottom: "4px" }}>
          <button
            onClick={() => setCategoriaActiva(null)}
            style={{ padding: "6px 14px", borderRadius: "999px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap", backgroundColor: categoriaActiva === null ? "#dc2626" : "#3a3a3c", color: "white" }}
          >
            Todos
          </button>
          {categorias.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoriaActiva(categoriaActiva === c.id ? null : c.id)}
              style={{ padding: "6px 14px", borderRadius: "999px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600", whiteSpace: "nowrap", backgroundColor: categoriaActiva === c.id ? "#dc2626" : "#3a3a3c", color: "white" }}
            >
              {c.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Productos */}
      <div style={{ padding: "16px" }}>
        {loading ? (
          <p style={{ color: "#dc2626", textAlign: "center", marginTop: "40px" }}>Cargando...</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {productosFiltrados.map((p) => (
              <div key={p.id} style={{ backgroundColor: "#2c2c2e", borderRadius: "14px", border: "1px solid #3a3a3c", overflow: "hidden" }}>
                <div style={{ display: "flex", gap: "12px", padding: "14px" }}>
                  <div style={{ flexShrink: 0 }}>
                    {p.imagen ? (
                      <img src={p.imagen} alt={p.nombre} style={{ width: "72px", height: "72px", objectFit: "cover", borderRadius: "12px", border: "1px solid #48484a" }} />
                    ) : (
                      <div style={{ width: "72px", height: "72px", backgroundColor: "#3a3a3c", borderRadius: "12px", border: "1px solid #48484a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px" }}>📦</div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "white", fontWeight: "700", fontSize: "16px", margin: "0 0 4px" }}>{p.nombre}</p>
                    <p style={{ color: "#8e8e93", fontSize: "13px", margin: "0 0 8px" }}>{p.categoria || "Sin categoría"}</p>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span style={{ color: p.stock <= p.stock_minimo ? "#ff453a" : "#30d158", fontWeight: "700", fontSize: "15px" }}>
                        {p.stock} uds
                      </span>
                      {p.stock <= p.stock_minimo && (
                        <span style={{ fontSize: "11px", backgroundColor: "#3a0a0a", color: "#ff453a", padding: "2px 8px", borderRadius: "999px", fontWeight: "600" }}>
                          ⚠ Stock bajo
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", borderTop: "1px solid #3a3a3c" }}>
                  <button onClick={() => { setProductoEditar(p); setImagenEditPreview(p.imagen || ""); cargarTallas(p.id); setModalEditar(true); }} style={{ flex: 1, padding: "12px", backgroundColor: "transparent", border: "none", color: "#0a84ff", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
                    ✏️ Editar
                  </button>
                  <div style={{ width: "1px", backgroundColor: "#3a3a3c" }} />
                  <button onClick={() => { setProductoEliminar(p); setModalEliminar(true); }} style={{ flex: 1, padding: "12px", backgroundColor: "transparent", border: "none", color: "#ff453a", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
            {productosFiltrados.length === 0 && (
              <p style={{ textAlign: "center", color: "#8e8e93", padding: "40px" }}>No hay productos en esta categoría</p>
            )}
          </div>
        )}
      </div>

      {/* Nav inferior */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, backgroundColor: "#2c2c2e", borderTop: "1px solid #3a3a3c", display: "flex", zIndex: 40 }}>
        {[
          { label: "INICIO", path: "/inventario" },
          { label: "MOVIMIENTOS", path: "/movimientos" },
          { label: "CATEGORIAS", path: "/categorias" },
          { label: "USUARIOS", path: "/usuarios" },
        ].map((item) => (
          <button key={item.path} onClick={() => router.push(item.path)} style={{ flex: 1, padding: "12px 4px", backgroundColor: "transparent", border: "none", color: item.path === "/inventario" ? "#dc2626" : "#8e8e93", cursor: "pointer", fontSize: "11px", fontWeight: item.path === "/inventario" ? "700" : "400" }}>
            {item.label}
          </button>
        ))}
        <button onClick={cerrarSesion} style={{ flex: 1, padding: "12px 4px", backgroundColor: "transparent", border: "none", color: "#8e8e93", cursor: "pointer", fontSize: "11px" }}>
          CERRAR SESION
        </button>
      </div>

      {/* Modal eliminar */}
      {modalEliminar && productoEliminar && (
        <div style={modalOverlay}>
          <div style={modalBox("#ff453a")}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", color: "white", marginBottom: "12px" }}>🗑️ Eliminar producto</h2>
            <p style={{ color: "#8e8e93", marginBottom: "20px" }}>
              ¿Eliminar <span style={{ color: "white", fontWeight: "700" }}>{productoEliminar.nombre}</span>? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={confirmarEliminar} style={btnRed}>Sí, eliminar</button>
              <button onClick={() => { setModalEliminar(false); setProductoEliminar(null); }} style={btnGray}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo */}
      {modalNuevo && (
        <div style={modalOverlay}>
          <div style={modalBox("#dc2626")}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", color: "white" }}>+ NUEVO <span style={{ color: "#dc2626" }}>producto</span></h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input placeholder="Nombre del producto" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Stock inicial" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} style={inputStyle} />
              <input type="number" placeholder="Stock mínimo" value={form.stock_minimo} onChange={(e) => setForm({ ...form, stock_minimo: Number(e.target.value) })} style={inputStyle} />
              <select value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: Number(e.target.value) })} style={inputStyle}>
                <option value={0}>Sin categoría</option>
                {categorias.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
              </select>
              <div style={{ borderTop: "1px solid #3a3a3c", paddingTop: "12px" }}>
                <p style={{ color: "#dc2626", fontSize: "13px", marginBottom: "8px", fontWeight: "600" }}>Tallas</p>
                {tallas.map((t, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#3a3a3c", padding: "8px 12px", borderRadius: "10px", marginBottom: "6px" }}>
                    <span style={{ color: "white" }}>{t.talla}</span>
                    <span style={{ color: "#30d158" }}>{t.cantidad} uds</span>
                    <button onClick={() => setTallas(tallas.filter((_, j) => j !== i))} style={{ color: "#ff453a", background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>✕</button>
                  </div>
                ))}
                <div style={{ display: "flex", gap: "8px" }}>
                  <input placeholder="Talla" value={nuevaTalla.talla} onChange={(e) => setNuevaTalla({ ...nuevaTalla, talla: e.target.value })} style={{ ...inputStyle, width: "45%" }} />
                  <input type="number" placeholder="Cant." value={nuevaTalla.cantidad} onChange={(e) => setNuevaTalla({ ...nuevaTalla, cantidad: Number(e.target.value) })} style={{ ...inputStyle, width: "30%" }} />
                  <button onClick={() => { if (!nuevaTalla.talla) return; setTallas([...tallas, nuevaTalla]); setNuevaTalla({ talla: "", cantidad: 0 }); }} style={{ backgroundColor: "#dc2626", color: "white", padding: "10px 12px", borderRadius: "10px", border: "none", cursor: "pointer" }}>+ Add</button>
                </div>
              </div>
              <div style={{ borderTop: "1px solid #3a3a3c", paddingTop: "12px" }}>
                <p style={{ color: "#dc2626", fontSize: "13px", marginBottom: "8px", fontWeight: "600" }}>Foto</p>
                <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; setImagenFile(file); setImagenPreview(URL.createObjectURL(file)); }} style={{ ...inputStyle, padding: "8px" }} />
                {imagenPreview && <img src={imagenPreview} alt="preview" style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "10px", marginTop: "8px" }} />}
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
          <div style={modalBox("#0a84ff")}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "4px", color: "white" }}>✏️ Editar</h2>
            <p style={{ color: "#dc2626", fontWeight: "700", marginBottom: "16px", fontSize: "16px" }}>{productoEditar.nombre}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input placeholder="Nombre" value={productoEditar.nombre} onChange={(e) => setProductoEditar({ ...productoEditar, nombre: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Stock" value={productoEditar.stock} onChange={(e) => setProductoEditar({ ...productoEditar, stock: Number(e.target.value) })} style={inputStyle} />
              <input type="number" placeholder="Stock mínimo" value={productoEditar.stock_minimo} onChange={(e) => setProductoEditar({ ...productoEditar, stock_minimo: Number(e.target.value) })} style={inputStyle} />
              <select value={productoEditar.categoria_id} onChange={(e) => setProductoEditar({ ...productoEditar, categoria_id: Number(e.target.value) })} style={inputStyle}>
                <option value={0}>Sin categoría</option>
                {categorias.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
              </select>
              <div style={{ borderTop: "1px solid #3a3a3c", paddingTop: "12px" }}>
                <p style={{ color: "#0a84ff", fontSize: "13px", marginBottom: "8px", fontWeight: "600" }}>Tallas</p>
                {tallasEditar.map((t, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#3a3a3c", padding: "8px 12px", borderRadius: "10px", marginBottom: "6px" }}>
                    <span style={{ color: "white" }}>{t.talla}</span>
                    <input type="number" value={t.cantidad} onChange={(e) => { const updated = [...tallasEditar]; updated[i].cantidad = Number(e.target.value); setTallasEditar(updated); }} style={{ ...inputStyle, width: "80px", padding: "6px 8px" }} />
                    {t.id && <button onClick={() => eliminarTalla(t.id!)} style={{ color: "#ff453a", background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>✕</button>}
                  </div>
                ))}
                <div style={{ display: "flex", gap: "8px" }}>
                  <input placeholder="Talla" value={nuevaTallaEditar.talla} onChange={(e) => setNuevaTallaEditar({ ...nuevaTallaEditar, talla: e.target.value })} style={{ ...inputStyle, width: "45%" }} />
                  <input type="number" placeholder="Cant." value={nuevaTallaEditar.cantidad} onChange={(e) => setNuevaTallaEditar({ ...nuevaTallaEditar, cantidad: Number(e.target.value) })} style={{ ...inputStyle, width: "30%" }} />
                  <button onClick={() => { if (!nuevaTallaEditar.talla) return; setTallasEditar([...tallasEditar, nuevaTallaEditar]); setNuevaTallaEditar({ talla: "", cantidad: 0 }); }} style={{ backgroundColor: "#0a84ff", color: "white", padding: "10px 12px", borderRadius: "10px", border: "none", cursor: "pointer" }}>+ Add</button>
                </div>
              </div>
              <div style={{ borderTop: "1px solid #3a3a3c", paddingTop: "12px" }}>
                <p style={{ color: "#0a84ff", fontSize: "13px", marginBottom: "8px", fontWeight: "600" }}>Cambiar foto</p>
                <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; setImagenEditFile(file); setImagenEditPreview(URL.createObjectURL(file)); }} style={{ ...inputStyle, padding: "8px" }} />
                {imagenEditPreview && <img src={imagenEditPreview} alt="preview" style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "10px", marginTop: "8px" }} />}
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