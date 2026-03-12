import { createClient } from "@/lib/supabase/server";
import { ActContextClient } from "./act-context-client";

type Encounter = {
  encid: string;
  title: string | null;
  starttime: string | null;
  endtime: string | null;
  duration: number | null;
  damage: number | null;
  encdps: number | null;
  zone: string | null;
  kills: number | null;
  deaths: number | null;
};

type Combatant = {
  id: number;
  encid: string;
  name: string | null;
  job: string | null;
  dps: number | null;
  encdps: number | null;
  damage: number | null;
};

type CurrentRow = {
  id: number;
  encid: string | null;
  title: string | null;
  starttime: string | null;
  duration: number | null;
  encdps: number | null;
};

export default async function DashboardActPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // ACT data: hydaelyn views over public (ODBC + overlay ingest). REST used here; GraphQL at /graphql/v1 available for future single-query load if hydaelyn is exposed in the GraphQL schema.
  const schema = supabase.schema("hydaelyn");
  let encounters: Encounter[] = [];
  let combatants: Combatant[] = [];
  let current: CurrentRow[] = [];
  let error: string | null = null;

  try {
    const [encountersRes, combatantsRes, currentRes] = await Promise.all([
      schema.from("encounter_table").select("*").order("starttime", { ascending: false }).limit(100),
      schema.from("combatant_table").select("*").order("id", { ascending: false }).limit(200),
      schema.from("current_table").select("*").order("updated_at", { ascending: false }).limit(10),
    ]);
    encounters = (encountersRes.data ?? []) as Encounter[];
    combatants = (combatantsRes.data ?? []) as Combatant[];
    current = (currentRes.data ?? []) as CurrentRow[];
    if (encountersRes.error) error = encountersRes.error.message;
    else if (combatantsRes.error) error = combatantsRes.error.message;
    else if (currentRes.error) error = currentRes.error.message;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load ACT data";
  }

  return (
    <ActContextClient
      encounters={encounters}
      combatants={combatants}
      current={current}
      error={error}
    />
  );
}
