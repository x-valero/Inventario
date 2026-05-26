import { NextResponse } from "next/server";
import db from "../../../lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const producto_id = searchParams.get("producto_id");
    if (!producto_id) return NextResponse.json({ error: "producto_id requerido" }, { status: 400 });
    const [rows] = await db.query("SELECT * FROM tallas WHERE producto_id = ? ORDER BY id ASC", [producto_id]);
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener tallas" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { producto_id, talla, cantidad, usuario_id } = await req.json();
    if (!producto_id || !talla || cantidad === undefined) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

    const [result]: any = await db.query(
      "INSERT INTO tallas (producto_id, talla, cantidad) VALUES (?, ?, ?)",
      [producto_id, talla, cantidad]
    );

    // Sumar al stock
    await db.query("UPDATE productos SET stock = stock + ? WHERE id = ?", [cantidad, producto_id]);

    // Registrar movimiento
    await db.query(
      "INSERT INTO movimientos (producto_id, usuario_id, tipo, cantidad, nota) VALUES (?, ?, 'entrada', ?, ?)",
      [producto_id, usuario_id || 1, cantidad, `Talla agregada: ${talla}`]
    );

    return NextResponse.json({ ok: true, id: result.insertId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error al agregar talla" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, cantidad, usuario_id } = await req.json();
    if (!id || cantidad === undefined) return NextResponse.json({ error: "Faltan campos" }, { status: 400 });

    // Obtener cantidad anterior
    const [rows]: any = await db.query("SELECT cantidad, producto_id, talla FROM tallas WHERE id = ?", [id]);
    if (rows.length === 0) return NextResponse.json({ error: "Talla no encontrada" }, { status: 404 });

    const { cantidad: anterior, producto_id, talla } = rows[0];
    const diferencia = cantidad - anterior;

    // Actualizar talla
    await db.query("UPDATE tallas SET cantidad = ? WHERE id = ?", [cantidad, id]);

    // Ajustar stock
    await db.query("UPDATE productos SET stock = stock + ? WHERE id = ?", [diferencia, producto_id]);

    // Registrar movimiento solo si hay diferencia
    if (diferencia !== 0) {
      const tipo = diferencia > 0 ? "entrada" : "salida";
      const cantAbs = Math.abs(diferencia);
      await db.query(
        "INSERT INTO movimientos (producto_id, usuario_id, tipo, cantidad, nota) VALUES (?, ?, ?, ?, ?)",
        [producto_id, usuario_id || 1, tipo, cantAbs, `Ajuste talla ${talla}: ${diferencia > 0 ? "+" : ""}${diferencia} unidades`]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar talla" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id, usuario_id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    const [rows]: any = await db.query("SELECT cantidad, producto_id, talla FROM tallas WHERE id = ?", [id]);
    if (rows.length === 0) return NextResponse.json({ error: "Talla no encontrada" }, { status: 404 });

    const { cantidad, producto_id, talla } = rows[0];

    // Eliminar talla
    await db.query("DELETE FROM tallas WHERE id = ?", [id]);

    // Restar del stock
    await db.query("UPDATE productos SET stock = GREATEST(stock - ?, 0) WHERE id = ?", [cantidad, producto_id]);

    // Registrar movimiento
    await db.query(
      "INSERT INTO movimientos (producto_id, usuario_id, tipo, cantidad, nota) VALUES (?, ?, 'salida', ?, ?)",
      [producto_id, usuario_id || 1, cantidad, `Talla eliminada: ${talla}`]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar talla" }, { status: 500 });
  }
}