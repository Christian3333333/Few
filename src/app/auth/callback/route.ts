import { redirect } from "next/navigation";
import { completeGoogleCallback } from "@/auth/session";

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code");
  if (code) await completeGoogleCallback(code);
  redirect("/inicio");
}
