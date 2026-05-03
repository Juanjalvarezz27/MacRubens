import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { metodoPagoId, referencia } = body;

    const pedidoActualizado = await prisma.$transaction(async (tx) => {
      // 1. Actualizar el estado de la orden a PAGADO
      const pedido = await tx.pedido.update({
        where: { id },
        data: { estadoPago: "PAGADO", updatedAt: new Date() }
      });

      // 2. Crear el registro del pago financiero
      await tx.pago.create({
        data: {
          pedidoId: id,
          metodoPagoId: metodoPagoId,
          montoUSD: pedido.totalUSD,
          montoVES: pedido.totalVES,
          referencia: referencia || null
        }
      });

      return pedido;
    });

    return NextResponse.json({ success: true, pedido: pedidoActualizado }, { status: 200 });

  } catch (error) {
    console.error("Error procesando pago:", error);
    return NextResponse.json({ error: "Error al procesar el pago" }, { status: 500 });
  }
}