import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ cedula: string }> }) {
  try {
    const { cedula } = await params;
    
    if (!cedula) return NextResponse.json({ error: "Cédula requerida" }, { status: 400 });

    const cliente = await prisma.cliente.findUnique({
      where: { cedula }
    });

    if (!cliente) return NextResponse.json(null, { status: 404 }); // No existe, el frontend sabrá que es nuevo

    return NextResponse.json(cliente, { status: 200 });
  } catch (error) {
    console.error("Error buscando cliente:", error);
    return NextResponse.json({ error: "Error en el servidor" }, { status: 500 });
  }
}