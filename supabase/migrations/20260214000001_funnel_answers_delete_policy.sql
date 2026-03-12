-- Allow authenticated users to delete answers for their own runs (inline form resubmit)
create policy "funnel_answers_delete_own_run"
  on public.funnel_answers for delete
  to authenticated
  using (exists (
    select 1 from public.funnel_runs
    where funnel_runs.id = funnel_answers.run_id
    and funnel_runs.user_id = (select auth.uid())
  ));
