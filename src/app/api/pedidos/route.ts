import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getToken } from "next-auth/jwt";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) return NextResponse.json({ error: "No autorizado. Inicia sesión." }, { status: 401 });

    let usuarioId = token.sub;
    if (!usuarioId) {
      const admin = await prisma.usuario.findFirst();
      if (!admin) return NextResponse.json({ error: "Usuario no encontrado en la BD" }, { status: 500 });
      usuarioId = admin.id;
    }

    const body = await req.json();
    const { cliente, cart, tasaBCV, metodoPagoId, referencia, totalUSD, totalVES, estadoPago } = body;

    if (!cart || cart.length === 0) return NextResponse.json({ error: "El ticket está vacío" }, { status: 400 });
    
    if (estadoPago === "PAGADO" && !metodoPagoId) {
      return NextResponse.json({ error: "Falta el método de pago" }, { status: 400 });
    }

    // MAGIA DE ZONA HORARIA: Forzamos la hora exacta de Venezuela
    const now = new Date();
    const venezuelaTimeString = now.toLocaleString("en-US", { timeZone: "America/Caracas" });
    const venezuelaDate = new Date(venezuelaTimeString);

    const pedidoCreado = await prisma.$transaction(async (tx) => {
      
      const clienteDb = await tx.cliente.upsert({
        where: { cedula: cliente.cedula },
        update: { nombre: cliente.nombre, telefono: cliente.telefono, updatedAt: venezuelaDate },
        create: { cedula: cliente.cedula, nombre: cliente.nombre, telefono: cliente.telefono, createdAt: venezuelaDate, updatedAt: venezuelaDate }
      });

      const estado = await tx.estadoPedido.findUnique({
        where: { nombre: "Completado" }
      });
      if (!estado) throw new Error("El estado 'Completado' no existe en la base de datos.");

      // Insertamos la fecha forzada en el Pedido
      const pedido = await tx.pedido.create({
        data: {
          clienteId: clienteDb.id,
          usuarioId: usuarioId, 
          estadoId: estado.id,
          estadoPago: estadoPago, 
          totalUSD: totalUSD,
          totalVES: totalVES,
          tasaBCV: tasaBCV,
          createdAt: venezuelaDate, // Sobrescribimos el default(now()) de Prisma
          updatedAt: venezuelaDate  // Sobrescribimos el updatedAt
        }
      });

      const detallesData: any[] = [];
      cart.forEach((item: any) => {
        detallesData.push({
          pedidoId: pedido.id,
          productoId: item.producto.id,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.precioUnitario * item.cantidad
        });

        if (item.subItems && item.subItems.length > 0) {
          item.subItems.forEach((sub: any) => {
            detallesData.push({
              pedidoId: pedido.id,
              productoId: sub.producto.id,
              cantidad: sub.cantidad * item.cantidad, 
              precioUnitario: sub.precio,
              subtotal: (sub.precio * sub.cantidad) * item.cantidad
            });
          });
        }
      });

      await tx.detallePedido.createMany({ data: detallesData });

      if (estadoPago === "PAGADO") {
        await tx.pago.create({
          data: {
            pedidoId: pedido.id,
            metodoPagoId: metodoPagoId,
            montoUSD: totalUSD,
            montoVES: totalVES,
            referencia: referencia || null,
            createdAt: venezuelaDate // Sobrescribimos el default(now()) en el pago
          }
        });
      }

      return pedido;
    });

    return NextResponse.json({ success: true, pedidoId: pedidoCreado.id }, { status: 201 });

  } catch (error: any) {
    console.error("Error procesando pedido:", error);
    return NextResponse.json({ error: error.message || "Error interno al procesar el pago" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const metodos = await prisma.metodoPago.findMany({
      orderBy: { nombre: 'asc' }
    });
    return NextResponse.json(metodos, { status: 200 });
  } catch (error) {
    console.error("Error obteniendo métodos:", error);
    return NextResponse.json({ error: "Error obteniendo métodos de pago" }, { status: 500 });
  }
}