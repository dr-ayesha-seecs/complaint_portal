import { redirect } from "next/navigation";
import { PasswordForm } from "@/components/PasswordForm";
import { getCurrentUser } from "@/lib/current-user";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <>
      <h1>Your password</h1>
      <p>
        Signed in as {user.name} ({user.email}).
      </p>
      <PasswordForm />
    </>
  );
}
