import { NextResponse } from "next/server";
import db from "../../../lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const producto_id = searchParams.get("producto_id");

    if (!producto_id) {
      return NextResponse.json({ error: "producto_id requerido" }, { status: 400 });
    }

    const [rows] = await db.query(
      "SELECT * FROM tallas WHERE producto_id = ? ORDER BY id ASC",
      [producto_id]
    );

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener tallas" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { producto_id, talla, cantidad } = await req.json();

    if (!producto_id || !talla || cantidad === undefined) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }

    // Insertar talla
    const [result]: any = await db.query(
      "INSERT INTO tallas (producto_id, talla, cantidad) VALUES (?, ?, ?)",
      [producto_id, talla, cantidad]
    );

    // Sumar al stock del producto
    await db.query(
      "UPDATE productos SET stock = stock + ? WHERE id = ?",
      [cantidad, producto_id]
    );

    return NextResponse.json({ ok: true, id: result.insertId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error al agregar talla" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, cantidad } = await req.json();

    if (!id || cantidad === undefined) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }

    // Obtener cantidad anterior
    const [rows]: any = await db.query(
      "SELECT cantidad, producto_id FROM tallas WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Talla no encontrada" }, { status: 404 });
    }

    const anterior = rows[0].cantidad;
    const producto_id = rows[0].producto_id;
    const diferencia = cantidad - anterior;

    // Actualizar talla
    await db.query("UPDATE tallas SET cantidad = ? WHERE id = ?", [cantidad, id]);

    // Ajustar stock según diferencia
    await db.query(
      "UPDATE productos SET stock = stock + ? WHERE id = ?",
      [diferencia, producto_id]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar talla" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    // Obtener cantidad y producto antes de borrar
    const [rows]: any = await db.query(
      "SELECT cantidad, producto_id FROM tallas WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "Talla no encontrada" }, { status: 404 });
    }

    const { cantidad, producto_id } = rows[0];

    // Eliminar talla
    await db.query("DELETE FROM tallas WHERE id = ?", [id]);

    // Restar del stock del producto
    await db.query(
      "UPDATE productos SET stock = GREATEST(stock - ?, 0) WHERE id = ?",
      [cantidad, producto_id]
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar talla" }, { status: 500 });
  }
}