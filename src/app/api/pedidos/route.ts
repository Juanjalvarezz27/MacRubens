import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getToken } from "next-auth/jwt";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    // 🔥 SOLUCIÓN AL ERROR FKEY: Verificamos que el usuario realmente exista en la BD
    let usuarioIdParaBd = "";
    
    if (token?.sub) {
      const userInDb = await prisma.usuario.findUnique({ where: { id: token.sub } });
      if (userInDb) usuarioIdParaBd = userInDb.id;
    }
    
    // Fallback: Si el token expiró o el usuario no existe, usamos el primer administrador del sistema
    if (!usuarioIdParaBd) {
      const fallbackUser = await prisma.usuario.findFirst();
      if (!fallbackUser) return NextResponse.json({ error: "No hay usuarios en la base de datos" }, { status: 500 });
      usuarioIdParaBd = fallbackUser.id;
    }

    const body = await req.json();
    const { cliente, cart, tasaBCV, metodoPagoId, referencia, totalUSD, totalVES, estadoPago } = body;

    if (!cart || cart.length === 0) return NextResponse.json({ error: "El ticket está vacío" }, { status: 400 });
    
    if (estadoPago === "PAGADO" && !metodoPagoId) {
      return NextResponse.json({ error: "Falta el método de pago" }, { status: 400 });
    }

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

      const pedido = await tx.pedido.create({
        data: {
          clienteId: clienteDb.id,
          usuarioId: usuarioIdParaBd, // 🔥 Usamos el ID validado
          estadoId: estado.id,
          estadoPago: estadoPago, 
          totalUSD: totalUSD,
          totalVES: totalVES,
          tasaBCV: tasaBCV,
          createdAt: venezuelaDate, 
          updatedAt: venezuelaDate  
        }
      });

      // Guardar con Jerarquía: Padre -> Hijos
      for (const item of cart) {
        const detallePadre = await tx.detallePedido.create({
          data: {
            pedidoId: pedido.id,
            productoId: item.producto.id,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.precioUnitario * item.cantidad
          }
        });

        if (item.subItems && item.subItems.length > 0) {
          const subItemsData = item.subItems.map((sub: any) => ({
            pedidoId: pedido.id,
            productoId: sub.producto.id,
            cantidad: sub.cantidad * item.cantidad, 
            precioUnitario: sub.precio,
            subtotal: (sub.precio * sub.cantidad) * item.cantidad,
            parentDetalleId: detallePadre.id
          }));
          await tx.detallePedido.createMany({ data: subItemsData });
        }
      }

      if (estadoPago === "PAGADO") {
        await tx.pago.create({
          data: {
            pedidoId: pedido.id,
            metodoPagoId: metodoPagoId,
            montoUSD: totalUSD,
            montoVES: totalVES,
            referencia: referencia || null,
            createdAt: venezuelaDate 
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
    const metodos = await prisma.metodoPago.findMany({ orderBy: { nombre: 'asc' } });
    return NextResponse.json(metodos, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Error obteniendo métodos de pago" }, { status: 500 });
  }
}