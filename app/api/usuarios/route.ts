import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "../../../lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(
      "SELECT id, nombre, email, rol, creado_en FROM usuarios ORDER BY id ASC"
    );
    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { nombre, email, password, rol } = await req.json();

    if (!nombre || !email || !password) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result]: any = await db.query(
      "INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)",
      [nombre, email, hash, rol || "admin"]
    );

    return NextResponse.json({ ok: true, id: result.insertId }, { status: 201 });
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

    await db.query("DELETE FROM usuarios WHERE id = ?", [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar usuario" }, { status: 500 });
  }
}