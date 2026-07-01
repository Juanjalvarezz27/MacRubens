import { NextRequest, NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

// OBTENER ÓRDENES PARA COCINA (Que no estén "Listas")
export async function GET() {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Caracas' });
    const fechaCaracas = formatter.format(new Date());
    const inicioDia = new Date(`${fechaCaracas}T00:00:00.000-04:00`);

    const pedidos = await prisma.pedido.findMany({
      where: {
        createdAt: { gte: inicioDia },
        estado: { nombre: { not: "Listo" } } // Excluimos las que ya se despacharon
      },
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
      orderBy: { createdAt: 'asc' } // Las más viejas primero (First in, First out)
    });

    return NextResponse.json(pedidos, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Error obteniendo órdenes de cocina" }, { status: 500 });
  }
}

// MARCAR COMO LISTA
export async function PUT(req: NextRequest) {
  try {
    const { id } = await req.json();

    // Verificamos si existe el estado "Listo", si no, lo creamos para que no dé error
    let estadoListo = await prisma.estadoPedido.findUnique({ where: { nombre: "Listo" } });
    if (!estadoListo) {
      estadoListo = await prisma.estadoPedido.create({ data: { nombre: "Listo" } });
    }

    await prisma.pedido.update({
      where: { id },
      data: { estadoId: estadoListo.id }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Error actualizando pedido" }, { status: 500 });
  }
}