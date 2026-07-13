import { redirect } from "next/navigation";
import { getCurrentAdminState } from "@/lib/auth/admin";

export default async function StudioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const adminState = await getCurrentAdminState();

  if (adminState.status === "missing-env") {
    redirect("/login?reason=setup");
  }

  if (adminState.status === "unauthenticated") {
    redirect("/login?next=/studio");
  }

  if (adminState.status === "not-admin") {
    redirect("/login?reason=not-admin");
  }

  return children;
}
