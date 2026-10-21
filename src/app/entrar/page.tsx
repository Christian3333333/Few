import { redirect } from "next/navigation";
import { getSession } from "@/auth/session";
import { AuthScreen } from "@/components/auth-screen";

export default async function EntrarPage() {
  if (await getSession()) redirect("/inicio");
  return <AuthScreen mode="entrar" />;
}
