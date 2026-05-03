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
    const now = new Date();

    if (periodo === "hoy") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      dateFilter = { gte: start, lte: end };
    } else if (periodo === "semana") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      dateFilter = { gte: start };
    } else if (periodo === "mes") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      dateFilter = { gte: start };
    } else if (periodo === "ano") {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      dateFilter = { gte: start };
    } else if (periodo === "custom" && startDateParam && endDateParam) {
      const start = new Date(`${startDateParam}T00:00:00`);
      const end = new Date(`${endDateParam}T23:59:59`);
      dateFilter = { gte: start, lte: end };
    }

    const pedidos = await prisma.pedido.findMany({
      where: Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : undefined,
      include: {
        cliente: true,
        detalles: { include: { producto: true } },
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
    
    // rounded-4xlESTRUCTURA PARA AGRUPAR POR CLIENTE
    const clientesMap: Record<string, any> = {};

    pedidos.forEach(p => {
      // Cálculos generales
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
          if (!productos[nombre]) productos[nombre] = { cantidad: 0, ingresos: 0 };
          productos[nombre].cantidad += d.cantidad;
          productos[nombre].ingresos += d.subtotal;
        });
      } else {
        montoPendienteUSD += p.totalUSD;
      }

      // rounded-4xlLógica de Agrupación por Cliente
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
    const productosArray = Object.entries(productos).map(([nombre, p]) => ({ nombre, cantidad: p.cantidad, ingresos: p.ingresos })).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);

    // Convertimos el mapa de clientes a un array ordenado por el que más gastó en el periodo
    const historialClientes = Object.values(clientesMap).sort((a: any, b: any) => b.totalUSD - a.totalUSD);

    return NextResponse.json({
      totalUSD,
      totalVES,
      montoPendienteUSD,
      totalPedidosPagados: ordenesPagadas,
      totalClientes: historialClientes.length,
      metodos: metodosArray,
      topProductos: productosArray,
      historial: historialClientes // rounded-4xlEnviamos clientes agrupados
    }, { status: 200 });

  } catch (error) {
    console.error("Error estadísticas:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}