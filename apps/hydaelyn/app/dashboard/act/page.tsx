import { createClient } from "@/lib/supabase/server";
import { ActContextClient } from "./act-context-client";

export default async function DashboardActPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const schema = supabase.schema("hydaelyn");

  const [encountersRes, combatantsRes, currentRes] = await Promise.all([
    schema.from("encounter_table").select("*").order("starttime", { ascending: false }).limit(100),
    schema.from("combatant_table").select("*").order("id", { ascending: false }).limit(200),
    schema.from("current_table").select("*").order("updated_at", { ascending: false }).limit(10),
  ]);

  const encounters = encountersRes.data ?? [];
  const combatants = combatantsRes.data ?? [];
  const current = currentRes.data ?? [];

  return (
    <ActContextClient
      encounters={encounters}
      combatants={combatants}
      current={current}
    />
  );
}
