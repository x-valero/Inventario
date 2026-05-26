import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 🔧 Conexión a MySQL con fallback
    console.log("DB_HOST:", process.env.DB_HOST);
    console.log("DB_USER:", process.env.DB_USER);
    console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
    console.log("DB_NAME:", process.env.DB_NAME);

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "inventario_app",
    });

    const [rows]: any = await connection.execute(
      "SELECT * FROM usuarios WHERE email = ?",
      [email]
    );

    await connection.end();

    if (rows.length === 0) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    const usuario = rows[0];
    const passwordMatch = await bcrypt.compare(password, usuario.password);

    if (!passwordMatch) {
      return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
    }

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email, rol: usuario.rol },
      process.env.JWT_SECRET || "unasecretoseguro",
      { expiresIn: "1h" }
    );

    return NextResponse.json({
      token,
      user: {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
      },
    });

  } catch (error: any) {
    console.error("Error en login:", error.message);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}
