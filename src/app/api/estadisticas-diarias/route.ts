import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

    return NextResponse.json({
      fecha: inicioDia.toISOString(),
      pedidos
    }, { status: 200 });

  } catch (error) {
    console.error("Error obteniendo estadísticas diarias:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}