import { createFileStore } from "@/infra/file-store";
import { createSupabaseServerClient, supabaseConfigured } from "@/infra/supabase";
import { createSupabaseStore } from "@/infra/supabase-store";
import type { RemittanceStore } from "@/domain/store";

export async function getStore(): Promise<RemittanceStore> {
  if (supabaseConfigured()) return createSupabaseStore(await createSupabaseServerClient());
  return createFileStore();
}
