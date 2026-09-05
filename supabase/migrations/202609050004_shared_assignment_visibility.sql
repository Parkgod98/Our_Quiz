create or replace function public.get_group_assignments(p_group_id uuid)
returns table (
  group_id uuid,
  version_id uuid,
  assigned_at timestamptz,
  version_number integer,
  question_count integer,
  title text,
  subject text,
  week_number integer
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    gqs.group_id,
    gqs.version_id,
    gqs.assigned_at,
    v.version_number,
    v.question_count,
    s.title,
    s.subject,
    s.week_number
  from public.group_question_sets gqs
  join public.question_set_versions v on v.id = gqs.version_id
  join public.question_sets s on s.id = v.question_set_id
  where gqs.group_id = p_group_id
    and auth.uid() is not null
    and exists (
      select 1
      from public.group_members gm
      where gm.group_id = gqs.group_id
        and gm.user_id = auth.uid()
    )
  order by gqs.assigned_at desc;
$$;

grant execute on function public.get_group_assignments(uuid) to authenticated;

create or replace function public.get_my_group_assignments()
returns table (
  group_id uuid,
  version_id uuid,
  assigned_at timestamptz,
  version_number integer,
  question_count integer,
  title text,
  subject text,
  week_number integer
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    gqs.group_id,
    gqs.version_id,
    gqs.assigned_at,
    v.version_number,
    v.question_count,
    s.title,
    s.subject,
    s.week_number
  from public.group_members gm
  join public.group_question_sets gqs on gqs.group_id = gm.group_id
  join public.question_set_versions v on v.id = gqs.version_id
  join public.question_sets s on s.id = v.question_set_id
  where auth.uid() is not null
    and gm.user_id = auth.uid()
  order by gqs.assigned_at desc;
$$;

grant execute on function public.get_my_group_assignments() to authenticated;
