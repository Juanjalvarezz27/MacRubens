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

    // Traer TODOS los pedidos de HOY
    const pedidos = await prisma.pedido.findMany({
      where: {
        createdAt: { gte: inicioDia, lte: finDia },
      },
      include: {
        cliente: true, // Para sacar el nombre
        pagos: {
          include: { metodo: true } // Para saber cómo pagó
        }
      },
      orderBy: {
        createdAt: 'desc' // Los más recientes primero
      }
    });

    let totalUSD = 0;
    let totalVES = 0;
    const desgloseMetodos: Record<string, { usd: number, ves: number }> = {};
    
    // Arrays para el recap
    const ordenesPagadas: any[] = [];
    const ordenesPendientes: any[] = [];

    pedidos.forEach(pedido => {
      // Formato limpio para la vista
      const infoOrden = {
        id: pedido.id,
        cliente: pedido.cliente.nombre,
        totalUSD: pedido.totalUSD,
        totalVES: pedido.totalVES,
        hora: pedido.createdAt,
        metodo: pedido.pagos.map(p => p.metodo.nombre).join(', ') || 'N/A'
      };

      if (pedido.estadoPago === "PAGADO") {
        totalUSD += pedido.totalUSD;
        totalVES += pedido.totalVES;

        pedido.pagos.forEach(pago => {
          const nombreMetodo = pago.metodo.nombre;
          if (!desgloseMetodos[nombreMetodo]) {
            desgloseMetodos[nombreMetodo] = { usd: 0, ves: 0 };
          }
          desgloseMetodos[nombreMetodo].usd += pago.montoUSD;
          desgloseMetodos[nombreMetodo].ves += pago.montoVES || 0;
        });

        ordenesPagadas.push(infoOrden);
      } else {
        ordenesPendientes.push(infoOrden);
      }
    });

    return NextResponse.json({
      fecha: inicioDia.toISOString(),
      totales: { totalUSD, totalVES },
      conteo: { pagados: ordenesPagadas.length, pendientes: ordenesPendientes.length },
      desgloseMetodos,
      ordenesPagadas,
      ordenesPendientes
    }, { status: 200 });

  } catch (error) {
    console.error("Error generando el cierre diario:", error);
    return NextResponse.json({ error: "Error interno al calcular el cierre" }, { status: 500 });
  }
}