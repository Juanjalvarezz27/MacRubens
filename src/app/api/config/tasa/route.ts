import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

export async function GET() {
  try {
    const config = await prisma.configuracion.findUnique({
      where: { clave: "tasa_bcv" }
    });
    // Si no hay tasa guardada aún, devolvemos 40 por defecto
    return NextResponse.json({ tasa: config ? parseFloat(config.valor) : 600 }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Error obteniendo tasa" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { tasa } = await req.json();
    
    // Upsert: Si no existe la crea, si existe la actualiza
    const config = await prisma.configuracion.upsert({
      where: { clave: "tasa_bcv" },
      update: { valor: tasa.toString(), updatedAt: new Date() },
      create: { clave: "tasa_bcv", valor: tasa.toString(), updatedAt: new Date() }
    });
    
    return NextResponse.json({ success: true, tasa: parseFloat(config.valor) }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Error guardando tasa" }, { status: 500 });
  }
}