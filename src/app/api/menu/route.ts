import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic'; 

export async function GET() {
  try {
    // 1. Obtenemos todos los productos incluyendo su categoría
    const productos = await prisma.producto.findMany({
      where: { activo: true },
      include: {
        categoria: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    // 2. Obtenemos las categorías para los selectores del frontend
    const categorias = await prisma.categoriaProducto.findMany({
      orderBy: { nombre: 'asc' }
    });

    return NextResponse.json({
      productos,
      categorias
    });

  } catch (error) {
    console.error("Error cargando el menú:", error);
    return NextResponse.json(
      { error: "No se pudo obtener la configuración del menú" }, 
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      nombre, 
      descripcion, 
      precioBase, 
      precioPequena, 
      categoriaId 
    } = body;

    // Validación según tu esquema (categoriaId es obligatorio)
    if (!nombre || precioBase === undefined || !categoriaId) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: nombre, precioBase o categoriaId" }, 
        { status: 400 }
      );
    }

    const nuevoProducto = await prisma.producto.create({
      data: {
        nombre,
        descripcion,
        precioBase: parseFloat(precioBase),
        precioPequena: precioPequena ? parseFloat(precioPequena) : null,
        categoriaId: categoriaId, // Relación directa por ID
        activo: true
      },
      include: {
        categoria: true // Retornamos el objeto completo para actualizar el UI
      }
    });

    return NextResponse.json(nuevoProducto, { status: 201 });

  } catch (error) {
    console.error("Error creando producto:", error);
    return NextResponse.json(
      { error: "Error interno al guardar el producto" }, 
      { status: 500 }
    );
  }
}