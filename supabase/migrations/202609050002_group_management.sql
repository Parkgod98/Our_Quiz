create policy "group owner deletes group"
on public.study_groups
for delete
to authenticated
using (created_by = auth.uid());

create policy "member leaves or owner removes member"
on public.group_members
for delete
to authenticated
using (
  user_id = auth.uid()
  or exists(
    select 1
    from public.study_groups g
    where g.id = group_id
      and g.created_by = auth.uid()
  )
);
