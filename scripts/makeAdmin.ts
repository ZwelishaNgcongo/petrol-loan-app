// scripts/makeAdmin.ts
// Run this script to make a user an admin
// Usage: npx tsx scripts/makeAdmin.ts <email>

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      process.exit(1);
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
    });

    console.log('✅ User updated successfully!');
    console.log('Email:', updatedUser.email);
    console.log('Role:', updatedUser.role);
    console.log('User ID:', updatedUser.id);
  } catch (error) {
    console.error('❌ Error updating user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: npx tsx scripts/makeAdmin.ts <email>');
  process.exit(1);
}

makeAdmin(email);