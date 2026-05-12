import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const periodo = searchParams.get("periodo") || "todo";
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    let dateFilter: any = {};
    
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Caracas' });
    const fechaCaracas = formatter.format(new Date()); 

    if (periodo === "hoy") {
      const start = new Date(`${fechaCaracas}T00:00:00.000-04:00`);
      const end = new Date(`${fechaCaracas}T23:59:59.999-04:00`);
      dateFilter = { gte: start, lte: end };
    } else if (periodo === "semana") {
      const baseDate = new Date(`${fechaCaracas}T12:00:00.000Z`);
      const day = baseDate.getUTCDay();
      const diff = day === 0 ? -6 : 1 - day;
      baseDate.setUTCDate(baseDate.getUTCDate() + diff);
      const startOfWeek = baseDate.toISOString().split('T')[0];
      const start = new Date(`${startOfWeek}T00:00:00.000-04:00`);
      dateFilter = { gte: start };
    } else if (periodo === "mes") {
      const startOfMonth = `${fechaCaracas.substring(0, 8)}01`;
      const start = new Date(`${startOfMonth}T00:00:00.000-04:00`);
      dateFilter = { gte: start };
    } else if (periodo === "ano") {
      const startOfYear = `${fechaCaracas.substring(0, 5)}01-01`;
      const start = new Date(`${startOfYear}T00:00:00.000-04:00`);
      dateFilter = { gte: start };
    } else if (periodo === "custom" && startDateParam && endDateParam) {
      const start = new Date(`${startDateParam}T00:00:00.000-04:00`);
      const end = new Date(`${endDateParam}T23:59:59.999-04:00`);
      dateFilter = { gte: start, lte: end };
    }

    const pedidos = await prisma.pedido.findMany({
      where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : undefined,
      include: {
        cliente: true,
        detalles: { 
          where: { parentDetalleId: null }, // Ignoramos toppings adicionales
          include: { 
            producto: { include: { categoria: true } } // 🔥 Traemos la categoría para filtrar
          } 
        },
        pagos: { include: { metodo: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    let totalUSD = 0;
    let totalVES = 0;
    let montoPendienteUSD = 0;
    let ordenesPagadas = 0;
    
    const metodos: Record<string, { usd: number, ves: number }> = {};
    const productos: Record<string, { cantidad: number, ingresos: number }> = {};
    const produccionBases: Record<string, number> = {}; // 🔥 Solo guardará masas de pizza
    const clientesMap: Record<string, any> = {};

    pedidos.forEach(p => {
      if (p.estadoPago === "PAGADO") {
        ordenesPagadas++;
        totalUSD += p.totalUSD;
        totalVES += p.totalVES;

        p.pagos.forEach(pago => {
          const nombre = pago.metodo?.nombre || "Otro";
          if (!metodos[nombre]) metodos[nombre] = { usd: 0, ves: 0 };
          metodos[nombre].usd += pago.montoUSD;
          metodos[nombre].ves += pago.montoVES || 0;
        });

        p.detalles.forEach(d => {
          const nombre = d.producto?.nombre || "Desconocido";
          const catNombre = d.producto?.categoria?.nombre?.toLowerCase() || "";
          
          // 1. Acumulamos para el gráfico financiero (Todos los productos)
          if (!productos[nombre]) productos[nombre] = { cantidad: 0, ingresos: 0 };
          productos[nombre].cantidad += d.cantidad;
          productos[nombre].ingresos += d.subtotal;

          // 2. Acumulamos para el Resumen de Producción (SOLO PIZZAS)
          const isPizza = ["base", "especial", "pizza"].some(c => catNombre.includes(c));
          if (isPizza) {
            produccionBases[nombre] = (produccionBases[nombre] || 0) + d.cantidad;
          }
        });
      } else {
        montoPendienteUSD += p.totalUSD;
      }

      const cId = p.clienteId || "anonimo";
      if (!clientesMap[cId]) {
        clientesMap[cId] = {
          id: cId,
          nombre: p.cliente?.nombre || "Consumidor Final",
          cedula: p.cliente?.cedula || "N/A",
          totalUSD: 0,
          totalVES: 0,
          cantidadOrdenes: 0,
          ordenes: []
        };
      }

      clientesMap[cId].totalUSD += p.totalUSD;
      clientesMap[cId].totalVES += p.totalVES;
      clientesMap[cId].cantidadOrdenes += 1;
      clientesMap[cId].ordenes.push({
        id: p.id,
        fecha: p.createdAt,
        totalUSD: p.totalUSD,
        totalVES: p.totalVES,
        estado: p.estadoPago,
        productos: p.detalles.map(d => `${d.cantidad}x ${d.producto?.nombre}`).join(", ")
      });
    });

    const metodosArray = Object.entries(metodos).map(([nombre, m]) => ({ nombre, usd: m.usd, ves: m.ves })).sort((a, b) => b.usd - a.usd);
    const productosArray = Object.entries(productos).map(([nombre, p]) => ({ nombre, cantidad: p.cantidad, ingresos: p.ingresos })).sort((a, b) => b.cantidad - a.cantidad);
    const produccionArray = Object.entries(produccionBases).map(([nombre, cantidad]) => ({ nombre, cantidad })).sort((a, b) => b.cantidad - a.cantidad); // 🔥 Array de masas

    const historialClientes = Object.values(clientesMap).sort((a: any, b: any) => b.totalUSD - a.totalUSD);

    return NextResponse.json({
      totalUSD,
      totalVES,
      montoPendienteUSD,
      totalPedidosPagados: ordenesPagadas,
      totalClientes: historialClientes.length,
      metodos: metodosArray,
      produccionBases: produccionArray, 
      topProductos: productosArray.slice(0, 5), 
      historial: historialClientes
    }, { status: 200 });

  } catch (error) {
    console.error("Error estadísticas:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}