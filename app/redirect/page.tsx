// app/redirect/page.tsx
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/clerkHelper";

export default async function RedirectPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Redirect based on role
  if (user.role === "ADMIN") {
    redirect("/admin");
  } else {
    redirect("/dashboard");
  }

  return null;
}