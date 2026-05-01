import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedUsuario(prisma: PrismaClient) {
  console.log(' Sembrando Usuario Admin...');
  
  const existe = await prisma.usuario.findFirst({
    where: { username: 'admin' },
  });

  if (!existe) {
    const hashedPassword = await bcrypt.hash('1234', 10);
    await prisma.usuario.create({
      data: {
        username: 'admin',
        nombre: 'Administrador Rubens',
        password: hashedPassword,
      },
    });
  }
}