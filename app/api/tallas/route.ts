import { NextResponse } from "next/server";
import db from "../../../lib/db";

// GET → tallas de un producto
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

// POST → agregar talla
export async function POST(req: Request) {
  try {
    const { producto_id, talla, cantidad } = await req.json();

    if (!producto_id || !talla || cantidad === undefined) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }

    const [result]: any = await db.query(
      "INSERT INTO tallas (producto_id, talla, cantidad) VALUES (?, ?, ?)",
      [producto_id, talla, cantidad]
    );

    return NextResponse.json({ ok: true, id: result.insertId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error al agregar talla" }, { status: 500 });
  }
}

// PUT → actualizar cantidad de talla
export async function PUT(req: Request) {
  try {
    const { id, cantidad } = await req.json();

    if (!id || cantidad === undefined) {
      return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
    }

    await db.query("UPDATE tallas SET cantidad = ? WHERE id = ?", [cantidad, id]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar talla" }, { status: 500 });
  }
}

// DELETE → eliminar talla
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    await db.query("DELETE FROM tallas WHERE id = ?", [id]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar talla" }, { status: 500 });
  }
}