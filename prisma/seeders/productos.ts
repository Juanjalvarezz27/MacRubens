import { PrismaClient } from '@prisma/client';

export async function seedProductos(prisma: PrismaClient) {
  console.log(' Sembrando Menú de Productos...');
  
  // 1. Buscamos los IDs de las categorías (incluyendo Especial)
  const catBase = await prisma.categoriaProducto.findFirst({ where: { nombre: 'Base' } });
  const catEspecial = await prisma.categoriaProducto.findFirst({ where: { nombre: 'Especial' } });
  const catTopping = await prisma.categoriaProducto.findFirst({ where: { nombre: 'Topping' } });
  const catExtra = await prisma.categoriaProducto.findFirst({ where: { nombre: 'Extra' } });
  const catBebida = await prisma.categoriaProducto.findFirst({ where: { nombre: 'Bebida' } });
  const catDelivery = await prisma.categoriaProducto.findFirst({ where: { nombre: 'Delivery' } });

  if (!catBase || !catEspecial || !catTopping || !catExtra || !catBebida || !catDelivery) {
    throw new Error('Faltan categorías. Corre primero el seed de categorías.');
  }

  // 2. Preparamos los datos tal cual la imagen
  const productos = [
    // BASES (Crea tu pizza)
    { nombre: 'Pizza pequeña', descripcion: '6 porciones', precioBase: 6.00, categoriaId: catBase.id },
    { nombre: 'Pizza mediana', descripcion: '8 porciones', precioBase: 8.00, categoriaId: catBase.id },
    { nombre: 'Pizza familiar', descripcion: '12 porciones', precioBase: 11.00, categoriaId: catBase.id },
    
    // ESPECIALES (Ya armadas)
    { nombre: 'Pizza 4-Estaciones', descripcion: '4 adicionales distintos', precioBase: 19.99, categoriaId: catEspecial.id },
    { nombre: 'Pizza Fiesta', descripcion: '4 estaciones doble', precioBase: 24.00, categoriaId: catEspecial.id },

    // ADICIONALES (Toppings - Sin el precio de la pequeña por ahora)
    { nombre: 'Jamón', precioBase: 2.50, categoriaId: catTopping.id },
    { nombre: 'Maíz', precioBase: 2.50, categoriaId: catTopping.id },
    { nombre: 'Tocineta', precioBase: 2.75, categoriaId: catTopping.id },
    { nombre: 'Champiñones', precioBase: 2.50, categoriaId: catTopping.id },
    { nombre: 'Pepperoni', precioBase: 2.75, categoriaId: catTopping.id },
    { nombre: 'Salami', precioBase: 2.75, categoriaId: catTopping.id },
    { nombre: 'Aceitunas Negras', precioBase: 2.75, categoriaId: catTopping.id },
    { nombre: 'Salchichón', precioBase: 3.00, categoriaId: catTopping.id },
    { nombre: 'Chuleta Ahumada', precioBase: 3.00, categoriaId: catTopping.id },
    { nombre: 'Anchoas', precioBase: 3.00, categoriaId: catTopping.id },
    { nombre: 'Camarones', precioBase: 3.50, categoriaId: catTopping.id },
    
    // EXTRAS & DELIVERY
    { nombre: 'Borde de queso', precioBase: 3.50, categoriaId: catExtra.id },
    { nombre: 'Full queso', precioBase: 3.50, categoriaId: catExtra.id },
    { nombre: 'Caja para llevar', precioBase: 1.00, categoriaId: catExtra.id },
    { nombre: 'Servicio Delivery', precioBase: 0.00, categoriaId: catDelivery.id }, 
    
    // BEBIDAS
    { nombre: 'Refresco 1.5 lts', precioBase: 3.00, categoriaId: catBebida.id },
    { nombre: 'Refresco 1.25 lts', precioBase: 2.50, categoriaId: catBebida.id },
    { nombre: 'Refresco 1 lts', precioBase: 2.00, categoriaId: catBebida.id },
    { nombre: 'Refresco Vaso', precioBase: 1.00, categoriaId: catBebida.id },
    { nombre: 'Té', precioBase: 1.50, categoriaId: catBebida.id },
  ];

  // 3. Insertamos
  for (const prod of productos) {
    const existe = await prisma.producto.findFirst({ where: { nombre: prod.nombre } });
    if (!existe) {
      await prisma.producto.create({ data: prod });
    }
  }
}