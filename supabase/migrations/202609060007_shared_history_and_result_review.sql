create or replace function public.get_group_detail_overview(p_group_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_role text;
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select gm.role into v_role
  from public.group_members gm
  where gm.group_id = p_group_id
    and gm.user_id = auth.uid();

  if v_role is null then
    raise exception 'group access denied';
  end if;

  select jsonb_build_object(
    'currentUserId', auth.uid(),
    'group', jsonb_build_object(
      'id', g.id,
      'name', g.name,
      'inviteCode', g.invite_code,
      'createdBy', g.created_by,
      'createdAt', g.created_at
    ),
    'role', v_role,
    'members', coalesce((
      select jsonb_agg(jsonb_build_object(
        'userId', gm.user_id,
        'role', gm.role,
        'joinedAt', gm.joined_at,
        'displayName', coalesce(nullif(trim(p.display_name), ''), '멤버')
      ) order by gm.joined_at)
      from public.group_members gm
      left join public.profiles p on p.id = gm.user_id
      where gm.group_id = p_group_id
    ), '[]'::jsonb),
    'assignments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'versionId', gqs.version_id,
        'assignedAt', gqs.assigned_at,
        'versionNumber', v.version_number,
        'questionCount', v.question_count,
        'title', s.title,
        'subject', s.subject,
        'weekNumber', s.week_number
      ) order by gqs.assigned_at desc)
      from public.group_question_sets gqs
      join public.question_set_versions v on v.id = gqs.version_id
      join public.question_sets s on s.id = v.question_set_id
      where gqs.group_id = p_group_id
    ), '[]'::jsonb),
    'attempts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id,
        'userId', a.user_id,
        'score', a.score,
        'correctCount', coalesce(a.score, 0),
        'wrongCount', case when a.submitted_at is null then null else greatest(a.total - coalesce(a.score, 0), 0) end,
        'total', a.total,
        'submittedAt', a.submitted_at,
        'title', s.title,
        'versionNumber', v.version_number
      ) order by a.submitted_at desc nulls first, a.started_at desc)
      from (
        select attempts.*
        from public.attempts attempts
        where attempts.group_id = p_group_id
          and exists (
            select 1
            from public.group_members gm
            where gm.group_id = p_group_id
              and gm.user_id = attempts.user_id
          )
        order by attempts.submitted_at desc nulls first, attempts.started_at desc
        limit 100
      ) a
      join public.question_set_versions v on v.id = a.version_id
      join public.question_sets s on s.id = v.question_set_id
    ), '[]'::jsonb),
    'versions', case
      when v_role = 'owner' then coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', v.id,
          'label', s.title || ' · v' || v.version_number || ' · ' || v.question_count || '문제'
        ) order by s.week_number, s.title, v.version_number desc)
        from public.question_sets s
        join public.question_set_versions v on v.question_set_id = s.id
        where s.owner_id = auth.uid()
      ), '[]'::jsonb)
      else '[]'::jsonb
    end
  ) into v_result
  from public.study_groups g
  where g.id = p_group_id;

  if v_result is null then
    raise exception 'group not found';
  end if;

  return v_result;
end;
$$;

grant execute on function public.get_group_detail_overview(uuid) to authenticated;

create or replace function public.get_attempt_result(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if not exists(
    select 1 from public.attempts
    where id = p_attempt_id
      and user_id = auth.uid()
      and submitted_at is not null
  ) then
    raise exception 'submitted attempt not found';
  end if;

  select jsonb_build_object(
    'attemptId', a.id,
    'versionId', a.version_id,
    'groupId', a.group_id,
    'title', s.title,
    'version', v.version_number,
    'score', a.score,
    'total', a.total,
    'submittedAt', a.submitted_at,
    'questions', coalesce(jsonb_agg(jsonb_build_object(
      'id', q.question_key,
      'type', q.type,
      'topic', q.topic,
      'difficulty', q.difficulty,
      'prompt', q.prompt,
      'choices', q.choices,
      'items', q.items,
      'submittedAnswer', aa.submitted_answer,
      'correct', aa.is_correct,
      'answer', qa.answer,
      'explanation', qa.explanation
    ) order by q.order_index), '[]'::jsonb)
  ) into v_result
  from public.attempts a
  join public.question_set_versions v on v.id = a.version_id
  join public.question_sets s on s.id = v.question_set_id
  join public.questions q on q.version_id = v.id
  join public.question_answers qa on qa.question_id = q.id
  left join public.attempt_answers aa on aa.attempt_id = a.id and aa.question_id = q.id
  where a.id = p_attempt_id
  group by a.id, v.id, s.id;

  return v_result;
end;
$$;

grant execute on function public.get_attempt_result(uuid) to authenticated;
