import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function seedDatabase() {
  console.log("Cleaning database...");
  await prisma.auditLog.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.document.deleteMany();
  await prisma.user.deleteMany();

  console.log("Creating the 3 required roles...");
  
  const admin = await prisma.user.create({
    data: { email: 'admin@trustvault.com', role: 'ADMIN', passwordHash: 'password123' }
  });
  
  const owner = await prisma.user.create({
    data: { email: 'owner@trustvault.com', role: 'OWNER', passwordHash: 'password123' }
  });
  
  const viewer = await prisma.user.create({
    data: { email: 'viewer@trustvault.com', role: 'VIEWER', passwordHash: 'password123' }
  });

  console.log("✅ Database seeded successfully!");
  console.log("Credentials for the judges:");
  console.log("Admin: admin@trustvault.com / password123");
  console.log("Owner: owner@trustvault.com / password123");
  console.log("Viewer: viewer@trustvault.com / password123");

  process.exit();
}

seedDatabase();