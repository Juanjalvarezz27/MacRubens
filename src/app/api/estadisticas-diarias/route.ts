import { NextResponse } from "next/server";
import prisma from "@/src/lib/prisma";

export async function GET() {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', { 
      timeZone: 'America/Caracas',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    const fechaCaracas = formatter.format(new Date());
    const inicioDia = new Date(`${fechaCaracas}T00:00:00.000-04:00`);
    const finDia = new Date(`${fechaCaracas}T23:59:59.999-04:00`);

    const pedidos = await prisma.pedido.findMany({
      where: {
        createdAt: { gte: inicioDia, lte: finDia },
      },
      include: {
        cliente: true,
        pagos: {
          include: { metodo: true }
        },
        detalles: {
          where: { parentDetalleId: null }, // Solo trae productos principales (Padres)
          include: {
            producto: {
              include: { categoria: true }
            },
            subDetalles: { // Trae los Toppings anidados de este padre
              include: {
                producto: { include: { categoria: true } }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc' 
      }
    });

    // CONTEO DE PRODUCCIÓN (Cantidades de productos pagados)
    const conteoMap: Record<string, number> = {};
    pedidos.forEach(pedido => {
      if (pedido.estadoPago === "PAGADO") {
        pedido.detalles.forEach(detalle => {
          const nombre = detalle.producto?.nombre || "Desconocido";
          conteoMap[nombre] = (conteoMap[nombre] || 0) + detalle.cantidad;
        });
      }
    });

    const conteoProductos = Object.entries(conteoMap)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad); // Ordenar de mayor a menor

    return NextResponse.json({
      fecha: inicioDia.toISOString(),
      pedidos,
      conteoProductos // Lo mandamos a la vista
    }, { status: 200 });

  } catch (error) {
    console.error("Error obteniendo estadísticas diarias:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}