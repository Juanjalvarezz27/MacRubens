import { PrismaClient } from '@prisma/client';

export async function seedProductos(prisma: PrismaClient) {
  console.log(' Sembrando Menú de Productos...');

  // 1. Buscamos los IDs de las categorías (Mantenemos el plural que arreglamos antes para que no dé error)
  const catBase = await prisma.categoriaProducto.findFirst({ where: { nombre: 'Base' } });
  const catEspecial = await prisma.categoriaProducto.findFirst({ where: { nombre: 'Especial' } });
  const catTopping = await prisma.categoriaProducto.findFirst({ where: { nombre: 'Topping' } });
  const catExtra = await prisma.categoriaProducto.findFirst({ where: { nombre: 'Extra' } });
  const catBebida = await prisma.categoriaProducto.findFirst({ where: { nombre: 'Bebida' } });
  const catDelivery = await prisma.categoriaProducto.findFirst({ where: { nombre: 'Delivery' } });

  if (!catBase || !catEspecial || !catTopping || !catExtra || !catBebida || !catDelivery) {
    throw new Error('Faltan categorías. Corre primero el seed de categorías.');
  }

  // 2. Preparamos los datos EXACTOS de la nueva imagen
  const productos = [
    // BASES (Crea tu pizza)
    { nombre: 'Pizza pequeña', descripcion: '6 slices', precioBase: 6.00, categoriaId: catBase.id },
    { nombre: 'Pizza mediana', descripcion: '8 slices', precioBase: 9.00, categoriaId: catBase.id }, // Subió a $9
    { nombre: 'Pizza familiar', descripcion: '12 slices', precioBase: 12.00, categoriaId: catBase.id }, // Subió a $12

    // ESPECIALES (Ya armadas)
    { nombre: 'Pizza 4-Estaciones', descripcion: 'Jamón/ Maíz/ tocineta/ Pepperoni', precioBase: 20.00, categoriaId: catEspecial.id }, // Subió a $20
    { nombre: 'Pizza Fiesta', descripcion: 'Jamón, Maíz, Tocineta, Champiñones, Salami, Aceitunas Negras, Pepperoni, Chuleta A.', precioBase: 25.00, categoriaId: catEspecial.id }, // Subió a $25

    // ADICIONALES (Toppings - Todos con precioPequena en 1.50)
    { nombre: 'Jamón', precioBase: 2.50, precioPequena: 1.50, categoriaId: catTopping.id },
    { nombre: 'Maíz', precioBase: 2.50, precioPequena: 1.50, categoriaId: catTopping.id },
    { nombre: 'Champiñón', precioBase: 2.50, precioPequena: 1.50, categoriaId: catTopping.id },
    { nombre: 'Tocineta', precioBase: 2.75, precioPequena: 1.50, categoriaId: catTopping.id },
    { nombre: 'Pepperoni', precioBase: 2.75, precioPequena: 1.50, categoriaId: catTopping.id },
    { nombre: 'Aceituna Negras', precioBase: 2.75, precioPequena: 1.50, categoriaId: catTopping.id },
    { nombre: 'Salami', precioBase: 2.75, precioPequena: 1.50, categoriaId: catTopping.id },
    { nombre: 'Salchichón', precioBase: 3.00, precioPequena: 1.50, categoriaId: catTopping.id },
    { nombre: 'Chuleta ahumada', precioBase: 3.00, precioPequena: 1.50, categoriaId: catTopping.id },
    { nombre: 'Anchoas', precioBase: 3.50, precioPequena: 1.50, categoriaId: catTopping.id }, // Subió a $3.50
    { nombre: 'Camarones', precioBase: 3.50, precioPequena: 1.50, categoriaId: catTopping.id },
    { nombre: 'Vegetales', precioBase: 1.00, precioPequena: 1.00, categoriaId: catTopping.id }, // NUEVO: Vegetales $1.00

    // EXTRAS & DELIVERY
    { nombre: 'Borde de Queso', precioBase: 4.00, categoriaId: catExtra.id }, // Subió a $4.00
    { nombre: 'Full Queso', precioBase: 3.50, categoriaId: catExtra.id },
    { nombre: 'Caja para llevar', precioBase: 1.00, categoriaId: catExtra.id },
    { nombre: 'Servicio Delivery', precioBase: 0.00, categoriaId: catDelivery.id },

    // BEBIDAS (Nuevas y actualizadas)
    { nombre: 'Refresco 1.5Lts', precioBase: 3.00, categoriaId: catBebida.id },
    { nombre: 'Refresco 1Lt', precioBase: 2.00, categoriaId: catBebida.id },
    { nombre: 'Refresco Lata', precioBase: 1.50, categoriaId: catBebida.id },
    { nombre: 'Jugo yukery 350ml', precioBase: 1.50, categoriaId: catBebida.id },
    { nombre: 'Maltin polar', precioBase: 1.50, categoriaId: catBebida.id },
    { nombre: 'Te Lipton 500 ml', precioBase: 2.50, categoriaId: catBebida.id },
    { nombre: 'Agua mineral', precioBase: 1.00, categoriaId: catBebida.id },
  ];

  // 3. Insertamos o actualizamos
  for (const prod of productos) {
    const existe = await prisma.producto.findFirst({ where: { nombre: prod.nombre } });
    if (!existe) {
      await prisma.producto.create({ data: prod });
    } else {
      // Actualizamos los precios por si ya existían pero con valores viejos
      await prisma.producto.update({
        where: { id: existe.id },
        data: prod
      });
    }
  }

  console.log(' Menú de Productos actualizado con éxito.');
}