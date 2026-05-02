import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// OBTENER PEDIDO
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const pedido = await prisma.pedido.findUnique({
      where: { id: id },
      include: {
        cliente: true,
        detalles: {
          where: { parentDetalleId: null },
          include: {
            producto: { include: { categoria: true } },
            subDetalles: { include: { producto: { include: { categoria: true } } } }
          }
        }
      }
    });

    if (!pedido) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    return NextResponse.json(pedido, { status: 200 });

  } catch (error) {
    console.error("Error obteniendo pedido:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ELIMINAR PEDIDO
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await prisma.pedido.delete({ where: { id: id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Error al eliminar el pedido" }, { status: 500 });
  }
}

// 🔥 ACTUALIZAR ORDEN COMPLETA (PUT)
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { cliente, cart, tasaBCV, totalUSD, totalVES, estadoPago, metodoPagoId, referencia } = body;

    const pedidoActualizado = await prisma.$transaction(async (tx) => {
      // 1. Actualizar datos del cliente por si cambiaron el teléfono o nombre
      const clienteDb = await tx.cliente.upsert({
        where: { cedula: cliente.cedula },
        update: { nombre: cliente.nombre, telefono: cliente.telefono },
        create: { cedula: cliente.cedula, nombre: cliente.nombre, telefono: cliente.telefono }
      });

      // 2. Actualizar totales y estado de la orden principal
      const pedido = await tx.pedido.update({
        where: { id },
        data: {
          clienteId: clienteDb.id,
          totalUSD,
          totalVES,
          tasaBCV,
          estadoPago,
          updatedAt: new Date()
        }
      });

      // 3. Borramos el carrito y pagos anteriores para evitar duplicados
      await tx.detallePedido.deleteMany({ where: { pedidoId: id } });
      await tx.pago.deleteMany({ where: { pedidoId: id } });

      // 4. Reconstruimos el carrito nuevo
      for (const item of cart) {
        const detallePadre = await tx.detallePedido.create({
          data: {
            pedidoId: id,
            productoId: item.producto.id,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.precioUnitario * item.cantidad
          }
        });

        if (item.subItems && item.subItems.length > 0) {
          const subItemsData = item.subItems.map((sub: any) => ({
            pedidoId: id,
            productoId: sub.producto.id,
            cantidad: sub.cantidad * item.cantidad, 
            precioUnitario: sub.precio,
            subtotal: (sub.precio * sub.cantidad) * item.cantidad,
            parentDetalleId: detallePadre.id
          }));
          await tx.detallePedido.createMany({ data: subItemsData });
        }
      }

      // 5. Registramos el pago si aplica
      if (estadoPago === "PAGADO" && metodoPagoId) {
        await tx.pago.create({
          data: {
            pedidoId: id,
            metodoPagoId,
            montoUSD: totalUSD,
            montoVES: totalVES,
            referencia: referencia || null
          }
        });
      }

      return pedido;
    });

    return NextResponse.json({ success: true, pedido: pedidoActualizado }, { status: 200 });

  } catch (error) {
    console.error("Error editando pedido completo:", error);
    return NextResponse.json({ error: "Error al editar el pedido" }, { status: 500 });
  }
}