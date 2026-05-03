import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const pendientes = await prisma.pedido.findMany({
      where: { estadoPago: "PENDIENTE" },
      include: {
        cliente: true,
        detalles: {
          where: { parentDetalleId: null },
          include: {
            producto: true,
            subDetalles: { include: { producto: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(pendientes, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo pendientes:", error);
    return NextResponse.json({ error: "Error al obtener las órdenes pendientes" }, { status: 500 });
  }
}