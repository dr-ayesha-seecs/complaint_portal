import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getCurrentUser } from "@/lib/current-user";

export const metadata: Metadata = { title: "Staff login" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return (
    <div className="wrap">
      <article className="panel" style={{ maxWidth: 560 }}>
        <h1>Staff login</h1>
        <p>Vice Chancellor, deans, chairpersons, complaints staff, and the harassment focal person sign in here. Students do not need an account. Use Track instead.</p>
        <LoginForm />
      </article>
    </div>
  );
}
