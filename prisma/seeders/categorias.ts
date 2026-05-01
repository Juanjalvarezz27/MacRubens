import { PrismaClient } from '@prisma/client';

export async function seedCategorias(prisma: PrismaClient) {
  console.log(' Sembrando Categorías...');
  await prisma.categoriaProducto.createMany({
    data: [
      { nombre: 'Base' },
      { nombre: 'Especial' }, 
      { nombre: 'Topping' },
      { nombre: 'Extra' },
      { nombre: 'Bebida' },
      { nombre: 'Delivery' },
    ],
    skipDuplicates: true,
  });
}