import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        pedidos: {
          orderBy: { createdAt: 'desc' },
          include: {
            //  AHORA TRAEMOS LOS PRODUCTOS DE CADA ORDEN
            detalles: {
              where: { parentDetalleId: null },
              include: {
                producto: true,
                subDetalles: { include: { producto: true } }
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' } 
    });

    const clientesConTotales = clientes.map(cliente => {
      const pedidosPagados = cliente.pedidos.filter(p => p.estadoPago === "PAGADO");
      const totalGastadoUSD = pedidosPagados.reduce((acc, p) => acc + p.totalUSD, 0);
      const totalGastadoVES = pedidosPagados.reduce((acc, p) => acc + p.totalVES, 0);
      
      return {
        ...cliente,
        totalGastadoUSD,
        totalGastadoVES,
        cantidadPedidos: cliente.pedidos.length,
        pedidosPagados: pedidosPagados.length
      };
    });

    return NextResponse.json(clientesConTotales, { status: 200 });

  } catch (error) {
    console.error("Error obteniendo clientes:", error);
    return NextResponse.json({ error: "Error al obtener los clientes" }, { status: 500 });
  }
}