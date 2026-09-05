create index if not exists group_members_user_joined_idx
on public.group_members(user_id, joined_at);

create index if not exists attempts_user_updated_idx
on public.attempts(user_id, updated_at desc);

create index if not exists attempts_group_submitted_idx
on public.attempts(group_id, submitted_at desc);

create index if not exists questions_version_order_idx
on public.questions(version_id, order_index);

create index if not exists question_sets_owner_week_idx
on public.question_sets(owner_id, week_number);

create or replace function public.get_playable_question_set(
  p_version_id uuid,
  p_group_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if p_group_id is not null then
    if not public.is_group_member(p_group_id)
      or not exists (
        select 1
        from public.group_question_sets gqs
        where gqs.group_id = p_group_id
          and gqs.version_id = p_version_id
      ) then
      raise exception 'group version access denied';
    end if;
  elsif not public.can_access_version(p_version_id) then
    raise exception 'version access denied';
  end if;

  select jsonb_build_object(
    'id', v.id,
    'versionNumber', v.version_number,
    'questionCount', v.question_count,
    'setId', s.portable_set_id,
    'title', s.title,
    'subject', s.subject,
    'week', s.week_number,
    'description', s.description,
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', q.question_key,
        'type', q.type,
        'topic', q.topic,
        'difficulty', q.difficulty,
        'prompt', q.prompt,
        'choices', q.choices,
        'items', q.items
      ) order by q.order_index)
      from public.questions q
      where q.version_id = v.id
    ), '[]'::jsonb)
  )
  into v_result
  from public.question_set_versions v
  join public.question_sets s on s.id = v.question_set_id
  where v.id = p_version_id;

  if v_result is null then
    raise exception 'version not found';
  end if;

  return v_result;
end;
$$;

grant execute on function public.get_playable_question_set(uuid, uuid) to authenticated;

create or replace function public.get_my_group_summaries()
returns table (
  id uuid,
  name text,
  role text,
  member_count bigint,
  assignment_count bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    g.id,
    g.name,
    gm.role,
    (select count(*) from public.group_members members where members.group_id = g.id) as member_count,
    (select count(*) from public.group_question_sets assignments where assignments.group_id = g.id) as assignment_count
  from public.group_members gm
  join public.study_groups g on g.id = gm.group_id
  where auth.uid() is not null
    and gm.user_id = auth.uid()
  order by gm.joined_at;
$$;

grant execute on function public.get_my_group_summaries() to authenticated;

create or replace function public.get_dashboard_overview()
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when auth.uid() is null then null
    else jsonb_build_object(
      'displayName', coalesce(
        (select nullif(trim(p.display_name), '') from public.profiles p where p.id = auth.uid()),
        '오늘'
      ),
      'attempts', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', recent.id,
          'versionId', recent.version_id,
          'groupId', recent.group_id,
          'groupName', recent.group_name,
          'score', recent.score,
          'total', recent.total,
          'startedAt', recent.started_at,
          'submittedAt', recent.submitted_at,
          'title', recent.title,
          'versionNumber', recent.version_number
        ) order by recent.updated_at desc)
        from (
          select
            a.id,
            a.version_id,
            a.group_id,
            g.name as group_name,
            a.score,
            a.total,
            a.started_at,
            a.submitted_at,
            a.updated_at,
            s.title,
            v.version_number
          from public.attempts a
          join public.question_set_versions v on v.id = a.version_id
          join public.question_sets s on s.id = v.question_set_id
          left join public.study_groups g on g.id = a.group_id
          where a.user_id = auth.uid()
          order by a.updated_at desc
          limit 30
        ) recent
      ), '[]'::jsonb),
      'assignments', coalesce((
        select jsonb_agg(jsonb_build_object(
          'groupId', assigned.group_id,
          'groupName', assigned.group_name,
          'versionId', assigned.version_id,
          'assignedAt', assigned.assigned_at,
          'versionNumber', assigned.version_number,
          'questionCount', assigned.question_count,
          'title', assigned.title,
          'subject', assigned.subject,
          'weekNumber', assigned.week_number
        ) order by assigned.assigned_at desc)
        from (
          select
            gm.group_id,
            g.name as group_name,
            gqs.version_id,
            gqs.assigned_at,
            v.version_number,
            v.question_count,
            s.title,
            s.subject,
            s.week_number
          from public.group_members gm
          join public.study_groups g on g.id = gm.group_id
          join public.group_question_sets gqs on gqs.group_id = gm.group_id
          join public.question_set_versions v on v.id = gqs.version_id
          join public.question_sets s on s.id = v.question_set_id
          where gm.user_id = auth.uid()
          order by gqs.assigned_at desc
          limit 8
        ) assigned
      ), '[]'::jsonb),
      'correct', (
        select count(*)::integer
        from public.attempt_answers aa
        join public.attempts a on a.id = aa.attempt_id
        where a.user_id = auth.uid()
          and a.submitted_at is not null
          and aa.is_correct = true
      ),
      'wrong', (
        select count(*)::integer
        from public.attempt_answers aa
        join public.attempts a on a.id = aa.attempt_id
        where a.user_id = auth.uid()
          and a.submitted_at is not null
          and aa.is_correct = false
      ),
      'weakTopics', coalesce((
        select jsonb_agg(jsonb_build_object(
          'topic', weak.topic,
          'correct', weak.correct_count,
          'total', weak.total_count
        ) order by weak.rate asc, weak.total_count desc)
        from (
          select
            q.topic,
            count(*) filter (where aa.is_correct = true)::integer as correct_count,
            count(*) filter (where aa.is_correct is not null)::integer as total_count,
            count(*) filter (where aa.is_correct = true)::numeric
              / nullif(count(*) filter (where aa.is_correct is not null), 0) as rate
          from public.attempt_answers aa
          join public.attempts a on a.id = aa.attempt_id
          join public.questions q on q.id = aa.question_id
          where a.user_id = auth.uid()
            and a.submitted_at is not null
            and aa.is_correct is not null
          group by q.topic
          order by rate asc, total_count desc
          limit 5
        ) weak
      ), '[]'::jsonb)
    )
  end;
$$;

grant execute on function public.get_dashboard_overview() to authenticated;
