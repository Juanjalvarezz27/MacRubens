import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// EDITAR PRODUCTO (PUT)
// Nota cómo params ahora se tipa como una Promesa
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Desempaquetamos la promesa con await (El estándar actual)
    const { id } = await params;
    
    const body = await req.json();
    const { nombre, descripcion, precioBase, precioPequena, categoriaId } = body;

    const productoActualizado = await prisma.producto.update({
      where: { id },
      data: {
        nombre,
        descripcion,
        precioBase: parseFloat(precioBase),
        precioPequena: precioPequena ? parseFloat(precioPequena) : null,
        categoriaId,
      },
      include: {
        categoria: true
      }
    });

    return NextResponse.json(productoActualizado, { status: 200 });
  } catch (error) {
    console.error("Error editando producto:", error);
    return NextResponse.json({ error: "Error al actualizar el producto" }, { status: 500 });
  }
}

// ELIMINAR PRODUCTO (BORRADO LÓGICO)
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Desempaquetamos el ID
    const { id } = await params;

    await prisma.producto.update({
      where: { id },
      data: { activo: false }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error eliminando producto:", error);
    return NextResponse.json({ error: "Error al eliminar el producto" }, { status: 500 });
  }
}