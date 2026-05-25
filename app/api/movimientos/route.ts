import { NextResponse } from "next/server";
import db from "../../../lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT 
        m.id,
        m.tipo,
        m.cantidad,
        m.nota,
        m.fecha,
        p.nombre AS producto,
        u.nombre AS usuario
      FROM movimientos m
      JOIN productos p ON m.producto_id = p.id
      JOIN usuarios  u ON m.usuario_id  = u.id
      ORDER BY m.fecha DESC
    `);
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener movimientos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { producto_id, usuario_id, tipo, cantidad, nota } = await req.json();

    if (!producto_id || !usuario_id || !tipo || !cantidad) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    await db.query(
      "INSERT INTO movimientos (producto_id, usuario_id, tipo, cantidad, nota) VALUES (?, ?, ?, ?, ?)",
      [producto_id, usuario_id, tipo, cantidad, nota || null]
    );

    // Actualizar stock según tipo
    if (tipo === "entrada") {
      await db.query("UPDATE productos SET stock = stock + ? WHERE id = ?", [cantidad, producto_id]);
    } else if (tipo === "salida") {
      await db.query("UPDATE productos SET stock = stock - ? WHERE id = ?", [cantidad, producto_id]);
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error al registrar movimiento" }, { status: 500 });
  }
}