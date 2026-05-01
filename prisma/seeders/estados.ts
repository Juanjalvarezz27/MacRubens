import { PrismaClient } from '@prisma/client';

export async function seedEstados(prisma: PrismaClient) {
  console.log(' Sembrando Estados de Pedido...');
  await prisma.estadoPedido.createMany({
    data: [
      { nombre: 'Pendiente' },
      { nombre: 'Completado' },
      { nombre: 'Cancelado' },
    ],
    skipDuplicates: true,
  });
}