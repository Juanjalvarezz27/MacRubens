import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// OBTENER PEDIDO (Ya lo teníamos)
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
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ELIMINAR PEDIDO
export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    
    // Al eliminar el pedido, Prisma eliminará los Detalles y Pagos automáticamente 
    // gracias al onDelete: Cascade que tienes en tu esquema.
    await prisma.pedido.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error eliminando pedido:", error);
    return NextResponse.json({ error: "Error al eliminar el pedido" }, { status: 500 });
  }
}

// EDITAR PEDIDO (Estado y Método de Pago)
export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { estadoPago, metodoPagoId } = body;

    const pedidoActualizado = await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.update({
        where: { id },
        data: { estadoPago }
      });

      if (estadoPago === "PAGADO" && metodoPagoId) {
        // Buscamos si ya tenía un pago registrado
        const pagoExistente = await tx.pago.findFirst({ where: { pedidoId: id } });
        
        if (pagoExistente) {
          await tx.pago.update({
            where: { id: pagoExistente.id },
            data: { metodoPagoId }
          });
        } else {
          await tx.pago.create({
            data: {
              pedidoId: id,
              metodoPagoId,
              montoUSD: pedido.totalUSD,
              montoVES: pedido.totalVES
            }
          });
        }
      } else if (estadoPago === "PENDIENTE") {
        // Si lo pasan a pendiente, eliminamos el registro del pago
        await tx.pago.deleteMany({ where: { pedidoId: id } });
      }

      return pedido;
    });

    return NextResponse.json({ success: true, pedido: pedidoActualizado }, { status: 200 });
  } catch (error) {
    console.error("Error editando pedido:", error);
    return NextResponse.json({ error: "Error al editar el pedido" }, { status: 500 });
  }
}