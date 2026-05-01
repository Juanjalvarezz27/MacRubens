import { PrismaClient } from '@prisma/client';

export async function seedMetodosPago(prisma: PrismaClient) {
  console.log(' Sembrando Métodos de Pago...');
  await prisma.metodoPago.createMany({
    data: [
      { nombre: 'Efectivo USD' },
      { nombre: 'Efectivo Bs' },
      { nombre: 'Pago Móvil' },
    ],
    skipDuplicates: true,
  });
}