import { PrismaClient } from '@prisma/client';

export async function seedCategorias(prisma: PrismaClient) {
  console.log(' Sembrando Categorías...');
  await prisma.categoriaProducto.createMany({
    data: [
      { nombre: 'Bases' },
      { nombre: 'Especiales' }, 
      { nombre: 'Toppings' },
      { nombre: 'Extras' },
      { nombre: 'Bebidas' },
      { nombre: 'Delivery' },
    ],
    skipDuplicates: true,
  });
}