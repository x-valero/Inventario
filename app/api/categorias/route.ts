import { NextResponse } from "next/server";
import db from "../../../lib/db";

// GET → listar categorias
export async function GET() {
  try {
    const [rows] = await db.query("SELECT * FROM categorias ORDER BY id ASC");
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener categorias" }, { status: 500 });
  }
}

// POST → crear categoria
export async function POST(req: Request) {
  try {
    const { nombre } = await req.json();

    if (!nombre) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });
    }

    const [result]: any = await db.query(
      "INSERT INTO categorias (nombre) VALUES (?)",
      [nombre]
    );

    return NextResponse.json({ ok: true, id: result.insertId }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Error al crear categoria" }, { status: 500 });
  }
}

// DELETE → eliminar categoria
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    await db.query("DELETE FROM categorias WHERE id = ?", [id]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar categoria" }, { status: 500 });
  }
}