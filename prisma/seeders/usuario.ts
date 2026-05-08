import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function seedUsuario(prisma: PrismaClient) {
  console.log('Sembrando Usuarios Administradores...');
  
  // Generamos el hash de la contraseña (1234 por defecto para ambos)
  const hashedPassword = await bcrypt.hash('1234', 10);

  // 1. Verificar y crear Usuario Rubens
  const existeRubens = await prisma.usuario.findFirst({
    where: { username: 'Rubens' },
  });

  if (!existeRubens) {
    await prisma.usuario.create({
      data: {
        username: 'Rubens',
        nombre: 'Administrador Rubens',
        password: hashedPassword,
      },
    });
    console.log('Usuario Rubens creado con éxito.');
  }

  // 2. Verificar y crear Usuario AdminJuan
  const existeJuan = await prisma.usuario.findFirst({
    where: { username: 'AdminJuan' },
  });

  if (!existeJuan) {
    await prisma.usuario.create({
      data: {
        username: 'AdminJuan', 
        nombre: 'Administrador Juan', 
        password: hashedPassword,
      },
    });
    console.log('Usuario AdminJuan creado con éxito.');
  }
}