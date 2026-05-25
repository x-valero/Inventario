import { NextResponse } from "next/server";
import db from "../../../lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT p.id, p.nombre, p.stock, p.stock_minimo, p.imagen,
             p.imagen_public_id, c.nombre AS categoria, c.id AS categoria_id,
             u.nombre AS creado_por, p.creado_en
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN usuarios   u ON p.creado_por   = u.id
      ORDER BY p.id DESC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { nombre, stock, stock_minimo, imagen, imagen_public_id, categoria_id, creado_por } = await req.json();

    if (!nombre || stock === undefined || stock_minimo === undefined) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const [result]: any = await db.query(
      "INSERT INTO productos (nombre, stock, stock_minimo, imagen, imagen_public_id, categoria_id, creado_por) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [nombre, stock, stock_minimo, imagen || null, imagen_public_id || null, categoria_id || null, creado_por || null]
    );

    await db.query(
      "INSERT INTO movimientos (producto_id, usuario_id, tipo, cantidad, nota) VALUES (?, ?, 'entrada', ?, 'Creación de producto')",
      [result.insertId, creado_por || 1, stock]
    );

    return NextResponse.json({ ok: true, id: result.insertId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, nombre, stock, stock_minimo, imagen, imagen_public_id, categoria_id } = await req.json();

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    await db.query(
      "UPDATE productos SET nombre = ?, stock = ?, stock_minimo = ?, imagen = ?, imagen_public_id = ?, categoria_id = ? WHERE id = ?",
      [nombre, stock, stock_minimo, imagen || null, imagen_public_id || null, categoria_id || null, id]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    await db.query("DELETE FROM productos WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }
}