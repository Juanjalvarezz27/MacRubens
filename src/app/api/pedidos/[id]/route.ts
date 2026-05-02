import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Actualizamos la firma para indicar que params es una Promesa
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // AQUÍ ESTÁ LA MAGIA: Esperamos (await) a que los params se resuelvan
    const { id } = await context.params;

    const pedido = await prisma.pedido.findUnique({
      where: { id: id }, // Ahora sí le pasamos el ID real
      include: {
        cliente: true,
        detalles: {
          where: { parentDetalleId: null },
          include: {
            producto: { include: { categoria: true } },
            subDetalles: { include: { producto: { include: { categoria: true } } } }
          }
        }
      }
    });

    if (!pedido) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    return NextResponse.json(pedido, { status: 200 });

  } catch (error) {
    console.error("Error obteniendo pedido:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}