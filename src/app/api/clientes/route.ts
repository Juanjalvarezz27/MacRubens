import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// OBTENER TODOS LOS CLIENTES
export async function GET(req: NextRequest) {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        pedidos: {
          orderBy: { createdAt: 'desc' },
          include: {
            detalles: {
              where: { parentDetalleId: null },
              include: {
                producto: true,
                subDetalles: { include: { producto: true } }
              }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const clientesConTotales = clientes.map(cliente => {
      const pedidosPagados = cliente.pedidos.filter(p => p.estadoPago === "PAGADO");
      const totalGastadoUSD = pedidosPagados.reduce((acc, p) => acc + p.totalUSD, 0);
      const totalGastadoVES = pedidosPagados.reduce((acc, p) => acc + p.totalVES, 0);

      return {
        ...cliente,
        totalGastadoUSD,
        totalGastadoVES,
        cantidadPedidos: cliente.pedidos.length,
        pedidosPagados: pedidosPagados.length
      };
    });

    return NextResponse.json(clientesConTotales, { status: 200 });

  } catch (error) {
    console.error("Error obteniendo clientes:", error);
    return NextResponse.json({ error: "Error al obtener los clientes" }, { status: 500 });
  }
}

// ACTUALIZAR CLIENTE (Nombre, Cédula y Teléfono)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, telefono, nombre, cedula } = body;

    // Preparamos el objeto con los datos a actualizar dinámicamente
    const dataToUpdate: any = { updatedAt: new Date() };
    if (telefono !== undefined) dataToUpdate.telefono = telefono || null;
    if (nombre !== undefined) dataToUpdate.nombre = nombre;
    if (cedula !== undefined) dataToUpdate.cedula = cedula;

    const clienteActualizado = await prisma.cliente.update({
      where: { id: id },
      data: dataToUpdate
    });

    return NextResponse.json(clienteActualizado, { status: 200 });
  } catch (error) {
    console.error("Error actualizando cliente:", error);
    return NextResponse.json({ error: "Error al actualizar los datos" }, { status: 500 });
  }
}