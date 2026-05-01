import { PrismaClient } from '@prisma/client';
import { seedCategorias } from './seeders/categorias';
import { seedEstados } from './seeders/estados';
import { seedMetodosPago } from './seeders/metodosPago';
import { seedUsuario } from './seeders/usuario';
import { seedProductos } from './seeders/productos';

const prisma = new PrismaClient();

async function main() {
  console.log(' Iniciando configuración de la base de datos...');
  
  try {
    await seedCategorias(prisma);
    await seedEstados(prisma);
    await seedMetodosPago(prisma);
    await seedUsuario(prisma);
    
    await seedProductos(prisma);
    
    console.log(' ¡Todos los datos iniciales fueron cargados con éxito!');
  } catch (error) {
    console.error(' Error crítico durante el seed:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });