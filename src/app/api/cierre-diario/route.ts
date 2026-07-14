import { NextResponse, NextRequest } from "next/server";
import prisma from "@/src/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const desdeParam = searchParams.get("desde");
    const hastaParam = searchParams.get("hasta");

    // Si se pasan los params usa el rango manual, sino usa el día actual en Caracas
    let inicioDia: Date;
    let finDia: Date;

    if (desdeParam && hastaParam) {
      inicioDia = new Date(desdeParam);
      finDia = new Date(hastaParam);
    } else {
      const parts = new Intl.DateTimeFormat('en-CA', { 
        timeZone: 'America/Caracas', 
        year: 'numeric', month: '2-digit', day: '2-digit', hour: 'numeric', hour12: false
      }).formatToParts(new Date());
      
      const p = Object.fromEntries(parts.map(part => [part.type, part.value]));
      const hour = parseInt(p.hour, 10);
      
      // Creamos una fecha neutral en UTC con los valores de Caracas
      const logicalDate = new Date(Date.UTC(parseInt(p.year), parseInt(p.month) - 1, parseInt(p.day)));
      
      if (hour < 5) {
        logicalDate.setUTCDate(logicalDate.getUTCDate() - 1);
      }
      
      const pad = (n: number) => String(n).padStart(2, '0');
      const y = logicalDate.getUTCFullYear();
      const m = pad(logicalDate.getUTCMonth() + 1);
      const d = pad(logicalDate.getUTCDate());
      const fechaStr = `${y}-${m}-${d}`;

      inicioDia = new Date(`${fechaStr}T05:00:00.000-04:00`);
      
      // Fin del día es a las 4:59:59 del día siguiente calendario (que es el fin lógico)
      logicalDate.setUTCDate(logicalDate.getUTCDate() + 1);
      const y2 = logicalDate.getUTCFullYear();
      const m2 = pad(logicalDate.getUTCMonth() + 1);
      const d2 = pad(logicalDate.getUTCDate());
      const fechaStr2 = `${y2}-${m2}-${d2}`;
      
      finDia = new Date(`${fechaStr2}T04:59:59.999-04:00`);
    }

    const pedidos = await prisma.pedido.findMany({
      where: {
        createdAt: { gte: inicioDia, lte: finDia },
      },
      select: {
        id: true,
        createdAt: true,
        estadoPago: true,
        totalUSD: true,
        totalVES: true,
        cliente: { select: { nombre: true } },
        pagos: {
          select: {
            montoUSD: true,
            montoVES: true,
            metodo: { select: { nombre: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    let totalUSD = 0;
    let totalVES = 0;
    let pagados = 0;
    let pendientes = 0;
    
    const metodos: Record<string, { usd: number; ves: number }> = {};
    const ordenesPagadas: any[] = [];
    const ordenesPendientes: any[] = [];

    pedidos.forEach(p => {
      if (p.estadoPago === "PAGADO") {
        pagados++;
        totalUSD += p.totalUSD;
        totalVES += p.totalVES;
        
        ordenesPagadas.push({
          id: p.id,
          cliente: p.cliente?.nombre || "Cliente",
          totalUSD: p.totalUSD,
          totalVES: p.totalVES,
          hora: p.createdAt,
          metodo: p.pagos[0]?.metodo?.nombre || "Otro"
        });

        p.pagos.forEach(pago => {
          const nombre = pago.metodo?.nombre || "Otro";
          if (!metodos[nombre]) metodos[nombre] = { usd: 0, ves: 0 };
          metodos[nombre].usd += pago.montoUSD;
          metodos[nombre].ves += (pago.montoVES || 0);
        });
      } else {
        pendientes++;
        ordenesPendientes.push({
          id: p.id,
          cliente: p.cliente?.nombre || "Cliente",
          totalUSD: p.totalUSD,
          totalVES: p.totalVES,
          hora: p.createdAt,
          metodo: "Pendiente"
        });
      }
    });

    return NextResponse.json({
      fecha: inicioDia.toISOString(),
      totales: { totalUSD, totalVES },
      conteo: { pagados, pendientes },
      desgloseMetodos: metodos,
      ordenesPagadas,
      ordenesPendientes
    }, { status: 200 });

  } catch (error) {
    console.error("Error obteniendo cierre:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}