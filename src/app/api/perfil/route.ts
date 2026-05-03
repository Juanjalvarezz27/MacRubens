import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { claveActual, nuevaClave } = body;

    if (!claveActual || !nuevaClave) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 });
    }

    // Buscamos al usuario (Como es un POS, tomamos el primer usuario administrador)
    const usuario = await prisma.usuario.findFirst();
    
    if (!usuario || !usuario.password) {
      return NextResponse.json({ error: "Usuario no configurado correctamente" }, { status: 404 });
    }

    // 1. Verificamos que la clave actual sea correcta
    const isValid = await bcrypt.compare(claveActual, usuario.password);
    if (!isValid) {
      return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 401 });
    }

    // 2. Encriptamos la nueva clave
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(nuevaClave, salt);

    // 3. Guardamos la nueva clave en la base de datos
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { password: hashedPassword }
    });

    return NextResponse.json({ success: true, message: "Contraseña actualizada" }, { status: 200 });

  } catch (error) {
    console.error("Error al cambiar clave:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}