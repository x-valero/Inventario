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

  // Modales
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [productoEliminar, setProductoEliminar] = useState<Producto | null>(null);
  const [productoEditar, setProductoEditar] = useState<Producto | null>(null);

  // Formulario nuevo
  const [form, setForm] = useState({ nombre: "", stock: 0, stock_minimo: 0, categoria_id: 0 });
  const [imagenFile, setImagenFile] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState("");
  const [tallas, setTallas] = useState<Talla[]>([]);
  const [nuevaTalla, setNuevaTalla] = useState({ talla: "", cantidad: 0 });

  // Formulario editar
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

    // Guardar tallas
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

    // Guardar tallas nuevas
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
    padding: "8px 12px",
    fontSize: "14px",
    color: "white",
    backgroundColor: "#1a1a1a",
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  const btnRed = { backgroundColor: "#dc2626", color: "white", padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "14px", flex: 1 };
  const btnGray = { backgroundColor: "#2a2a2a", color: "white", padding: "10px", borderRadius: "8px", border: "1px solid #444", cursor: "pointer", fontSize: "14px", flex: 1 };
  const btnBlue = { backgroundColor: "#2563eb", color: "white", padding: "10px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "14px", flex: 1 };

  const modalOverlay = { position: "fixed" as const, inset: 0, backgroundColor: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "16px" };
  const modalBox = (border: string) => ({ backgroundColor: "#111111", borderRadius: "12px", padding: "24px", width: "100%", maxWidth: "400px", border: `1px solid ${border}`, maxHeight: "90vh", overflowY: "auto" as const });

  return (
    <main style={{ minHeight: "100vh", backgroundColor: "#0a0a0a", padding: "16px" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", borderBottom: "1px solid #dc2626", paddingBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <h1 style={{ fontSize: "22px", fontWeight: "bold", color: "white" }}>
            📦 <span style={{ color: "#dc2626" }}>INVENTARIO VALERO STOREE</span> 
          </h1>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button onClick={() => router.push("/movimientos")} style={{ ...btnGray, flex: "unset", padding: "8px 12px" }}>MOVIMIENTOS</button>
            <button onClick={() => router.push("/categorias")} style={{ ...btnGray, flex: "unset", padding: "8px 12px" }}>CATEGORIAS</button>
            <button onClick={() => setModalNuevo(true)} style={{ ...btnRed, flex: "unset", padding: "8px 12px" }}>NUEVO</button>
            <button onClick={cerrarSesion} style={{ ...btnGray, flex: "unset", padding: "8px 12px" }}>SALIR</button>
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
                  {["Foto", "Producto", "Stock", "Mínimo", "Categoría", "Acciones"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#dc2626", fontWeight: "600" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id} style={{ borderTop: "1px solid #1f1f1f" }}>
                    <td style={{ padding: "12px 16px" }}>
                      {p.imagen ? (
                        <img src={p.imagen} alt={p.nombre} style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "8px", border: "1px solid #333" }} />
                      ) : (
                        <div style={{ width: "48px", height: "48px", backgroundColor: "#1a1a1a", borderRadius: "8px", border: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}></div>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", color: "white", fontWeight: "500" }}>{p.nombre}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ color: p.stock <= p.stock_minimo ? "#ef4444" : "#4ade80", fontWeight: "bold" }}>{p.stock}</span>
                      {p.stock <= p.stock_minimo && (
                        <span style={{ marginLeft: "6px", fontSize: "11px", backgroundColor: "#450a0a", color: "#f87171", padding: "2px 6px", borderRadius: "999px" }}>STOCK BAJO</span>
                      )}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#9ca3af" }}>{p.stock_minimo}</td>
                    <td style={{ padding: "12px 16px", color: "#9ca3af" }}>{p.categoria || "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button onClick={() => { setProductoEditar(p); setImagenEditPreview(p.imagen || ""); cargarTallas(p.id); setModalEditar(true); }} style={{ color: "#60a5fa", background: "none", border: "none", cursor: "pointer", fontSize: "13px" }}>✏️ Editar</button>
                        <button onClick={() => { setProductoEliminar(p); setModalEliminar(true); }} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontSize: "13px" }}>🗑️ Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {productos.length === 0 && (
              <p style={{ textAlign: "center", color: "#4b5563", padding: "32px" }}>NO HAY PRODUCTOS AUN</p>
            )}
          </div>
        )}
      </div>

      {/* Modal confirmar eliminar */}
      {modalEliminar && productoEliminar && (
        <div style={modalOverlay}>
          <div style={modalBox("#dc2626")}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", color: "white", marginBottom: "12px" }}>ELIMINAR PRODUCTO</h2>
            <p style={{ color: "#9ca3af", marginBottom: "20px" }}>
              ¿SEGURO QUE QUIERES ELIMINAR? <span style={{ color: "white", fontWeight: "bold" }}>{productoEliminar.nombre}</span> ESTA ACCION PUEDE DESHACER!
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={confirmarEliminar} style={btnRed}>SI ELIMINAR</button>
              <button onClick={() => { setModalEliminar(false); setProductoEliminar(null); }} style={btnGray}>CANCELAR</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo producto */}
      {modalNuevo && (
        <div style={modalOverlay}>
          <div style={modalBox("#dc2626")}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px", color: "white" }}>+ Nuevo <span style={{ color: "#dc2626" }}>PRODUCTO</span></h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input placeholder="Nombre del producto" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Stock inicial" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} style={inputStyle} />
              <input type="number" placeholder="Stock mínimo" value={form.stock_minimo} onChange={(e) => setForm({ ...form, stock_minimo: Number(e.target.value) })} style={inputStyle} />
              <select value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: Number(e.target.value) })} style={inputStyle}>
                <option value={0}>Sin categoría</option>
                {categorias.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
              </select>

              {/* Tallas */}
              <div style={{ borderTop: "1px solid #222", paddingTop: "12px" }}>
                <p style={{ color: "#dc2626", fontSize: "13px", marginBottom: "8px", fontWeight: "600" }}>Tallas</p>
                {tallas.map((t, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#1a1a1a", padding: "8px 12px", borderRadius: "8px", marginBottom: "6px" }}>
                    <span style={{ color: "white" }}>{t.talla}</span>
                    <span style={{ color: "#4ade80" }}>{t.cantidad} uds</span>
                    <button onClick={() => setTallas(tallas.filter((_, j) => j !== i))} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>✕</button>
                  </div>
                ))}
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <input placeholder="Talla (ej: S, M, 42)" value={nuevaTalla.talla} onChange={(e) => setNuevaTalla({ ...nuevaTalla, talla: e.target.value })} style={{ ...inputStyle, width: "50%" }} />
                  <input type="number" placeholder="Cantidad" value={nuevaTalla.cantidad} onChange={(e) => setNuevaTalla({ ...nuevaTalla, cantidad: Number(e.target.value) })} style={{ ...inputStyle, width: "30%" }} />
                  <button
                    onClick={() => {
                      if (!nuevaTalla.talla) return;
                      setTallas([...tallas, nuevaTalla]);
                      setNuevaTalla({ talla: "", cantidad: 0 });
                    }}
                    style={{ backgroundColor: "#dc2626", color: "white", padding: "8px 12px", borderRadius: "8px", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
                  >+ Add</button>
                </div>
              </div>

              {/* Foto */}
              <div style={{ borderTop: "1px solid #222", paddingTop: "12px" }}>
                <p style={{ color: "#dc2626", fontSize: "13px", marginBottom: "8px", fontWeight: "600" }}>FOTO DEL PRODUCTO</p>
                <input type="file" accept="image/*" capture="environment" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImagenFile(file);
                  setImagenPreview(URL.createObjectURL(file));
                }} style={{ ...inputStyle, padding: "6px" }} />
                {imagenPreview && <img src={imagenPreview} alt="preview" style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "8px", marginTop: "8px", border: "1px solid #333" }} />}
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button onClick={crearProducto} disabled={subiendo} style={{ ...btnRed, opacity: subiendo ? 0.6 : 1 }}>{subiendo ? "Guardando..." : "Guardar"}</button>
                <button onClick={() => { setModalNuevo(false); setImagenFile(null); setImagenPreview(""); setTallas([]); }} style={btnGray}>CANCELAR</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar producto */}
      {modalEditar && productoEditar && (
        <div style={modalOverlay}>
          <div style={modalBox("#2563eb")}>
            <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "4px", color: "white" }}>EDITAR PRODUCTO</h2>
            <p style={{ color: "#dc2626", fontWeight: "bold", marginBottom: "16px", fontSize: "16px" }}>{productoEditar.nombre}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <input placeholder="Nombre" value={productoEditar.nombre} onChange={(e) => setProductoEditar({ ...productoEditar, nombre: e.target.value })} style={inputStyle} />
              <input type="number" placeholder="Stock" value={productoEditar.stock} onChange={(e) => setProductoEditar({ ...productoEditar, stock: Number(e.target.value) })} style={inputStyle} />
              <input type="number" placeholder="Stock mínimo" value={productoEditar.stock_minimo} onChange={(e) => setProductoEditar({ ...productoEditar, stock_minimo: Number(e.target.value) })} style={inputStyle} />
              <select value={productoEditar.categoria_id} onChange={(e) => setProductoEditar({ ...productoEditar, categoria_id: Number(e.target.value) })} style={inputStyle}>
                <option value={0}>SIN CATEGORIA</option>
                {categorias.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
              </select>

              {/* Tallas editar */}
              <div style={{ borderTop: "1px solid #222", paddingTop: "12px" }}>
                <p style={{ color: "#60a5fa", fontSize: "13px", marginBottom: "8px", fontWeight: "600" }}>Tallas</p>
                {tallasEditar.map((t, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#1a1a1a", padding: "8px 12px", borderRadius: "8px", marginBottom: "6px" }}>
                    <span style={{ color: "white" }}>{t.talla}</span>
                    <input
                      type="number"
                      value={t.cantidad}
                      onChange={(e) => {
                        const updated = [...tallasEditar];
                        updated[i].cantidad = Number(e.target.value);
                        setTallasEditar(updated);
                      }}
                      style={{ ...inputStyle, width: "80px", padding: "4px 8px" }}
                    />
                    {t.id && <button onClick={() => eliminarTalla(t.id!)} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>✕</button>}
                  </div>
                ))}
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <input placeholder="Talla" value={nuevaTallaEditar.talla} onChange={(e) => setNuevaTallaEditar({ ...nuevaTallaEditar, talla: e.target.value })} style={{ ...inputStyle, width: "50%" }} />
                  <input type="number" placeholder="Cantidad" value={nuevaTallaEditar.cantidad} onChange={(e) => setNuevaTallaEditar({ ...nuevaTallaEditar, cantidad: Number(e.target.value) })} style={{ ...inputStyle, width: "30%" }} />
                  <button
                    onClick={() => {
                      if (!nuevaTallaEditar.talla) return;
                      setTallasEditar([...tallasEditar, nuevaTallaEditar]);
                      setNuevaTallaEditar({ talla: "", cantidad: 0 });
                    }}
                    style={{ backgroundColor: "#2563eb", color: "white", padding: "8px 12px", borderRadius: "8px", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
                  >AGREGAR</button>
                </div>
              </div>

              {/* Foto editar */}
              <div style={{ borderTop: "1px solid #222", paddingTop: "12px" }}>
                <p style={{ color: "#60a5fa", fontSize: "13px", marginBottom: "8px", fontWeight: "600" }}>CAMBIAR FOTO</p>
                <input type="file" accept="image/*" capture="environment" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setImagenEditFile(file);
                  setImagenEditPreview(URL.createObjectURL(file));
                }} style={{ ...inputStyle, padding: "6px" }} />
                {imagenEditPreview && <img src={imagenEditPreview} alt="preview" style={{ width: "100%", height: "150px", objectFit: "cover", borderRadius: "8px", marginTop: "8px", border: "1px solid #333" }} />}
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button onClick={editarProducto} disabled={subiendo} style={{ ...btnBlue, opacity: subiendo ? 0.6 : 1 }}>{subiendo ? "Guardando..." : "Guardar"}</button>
                <button onClick={() => { setModalEditar(false); setProductoEditar(null); setImagenEditFile(null); setImagenEditPreview(""); setTallasEditar([]); }} style={btnGray}>CANCELAR</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}