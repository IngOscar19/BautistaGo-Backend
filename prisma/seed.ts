import { PrismaClient, UserRole, PricingType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Salt 12 según stack del proyecto (bcrypt)
const SALT_ROUNDS = 12;
const DEFAULT_PASSWORD = 'BautistaGo2026!';

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function seedUsers(): Promise<Map<string, string>> {
  const passwordHash = await hashPassword(DEFAULT_PASSWORD);
  const ids = new Map<string, string>();

  const admin = await prisma.user.upsert({
    where: { email: 'admin@bautistago.mx' },
    update: {},
    create: {
      name: 'Administrador General',
      email: 'admin@bautistago.mx',
      passwordHash,
      role: UserRole.ADMIN,
      phone: '4151234567',
    },
  });
  ids.set('admin@bautistago.mx', admin.id);

  const cocina = [
    { name: 'Ana López', email: 'ana.cocina@bautistago.mx' },
    { name: 'María Hernández', email: 'maria.cocina@bautistago.mx' },
    { name: 'José Ramírez', email: 'jose.cocina@bautistago.mx' },
  ];
  for (const k of cocina) {
    const user = await prisma.user.upsert({
      where: { email: k.email },
      update: {},
      create: {
        name: k.name,
        email: k.email,
        passwordHash,
        role: UserRole.KITCHEN_OPERATOR,
        phone: '4151234568',
      },
    });
    ids.set(k.email, user.id);
  }

  const repartidores = [
    { name: 'Carlos Mendoza', email: 'carlos.repartidor@bautistago.mx', plate: 'GTO-123-A' },
    { name: 'Luis García', email: 'luis.repartidor@bautistago.mx', plate: null },
  ];
  for (const d of repartidores) {
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: {
        name: d.name,
        email: d.email,
        passwordHash,
        role: UserRole.DELIVERY_DRIVER,
        phone: '4151234569',
      },
    });
    ids.set(d.email, user.id);

    await prisma.deliveryDriver.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, vehiclePlate: d.plate },
    });
  }

  return ids;
}

async function seedProducts(): Promise<void> {
  const productos = [
    {
      name: 'Carnitas de Cerdo (por kg)',
      description: 'Carnitas tradicionales de San Miguel de Allende, preparadas al estilo Michoacán',
      pricingType: PricingType.BY_WEIGHT_KG,
      basePrice: 289.0,
    },
    {
      name: 'Carnitas Michoacanas (por gramo)',
      description: 'Corte fino de carnitas, venta por gramo para pedidos pequeños',
      pricingType: PricingType.BY_WEIGHT_G,
      basePrice: 0.35,
    },
    {
      name: 'Taco de Carnitas',
      description: 'Taco de carnitas con cilantro, cebolla y salsa verde',
      pricingType: PricingType.BY_PIECE,
      basePrice: 28.0,
    },
    {
      name: 'Torta de Carnitas',
      description: 'Torta con carne de carnitas, aguacate, frijoles y jalapeño',
      pricingType: PricingType.BY_PIECE,
      basePrice: 65.0,
    },
    {
      name: 'Orden de Chicharrón Prebocado (por kg)',
      description: 'Chicharrón prebocado recién hecho, ideal para compartir',
      pricingType: PricingType.BY_WEIGHT_KG,
      basePrice: 249.0,
    },
  ];

  for (const p of productos) {
    const exists = await prisma.product.findFirst({ where: { name: p.name } });
    if (!exists) {
      await prisma.product.create({ data: p });
    }
  }
}

async function main(): Promise<void> {
  console.log('Sembrando datos iniciales de BautistaGo...');
  await seedUsers();
  await seedProducts();
  console.log('Seed completado: 6 usuarios (1 ADMIN, 3 KITCHEN_OPERATOR, 2 DELIVERY_DRIVER) y 5 productos.');
}

main()
  .catch((e) => {
    console.error('Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
