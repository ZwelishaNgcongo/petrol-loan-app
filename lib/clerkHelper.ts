// lib/clerkHelper.ts
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

export async function getCurrentUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  // Sync user with database
  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });

  // If user doesn't exist in DB, create them
  if (!user) {
    const email = clerkUser.emailAddresses[0]?.emailAddress || "";
    
    user = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: email,
        role: "USER", // Default role
      },
    });
  }

  return {
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    role: user.role,
    firstName: clerkUser.firstName || "",
    lastName: clerkUser.lastName || "",
  };
}