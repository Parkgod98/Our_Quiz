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
        'total', a.total,
        'submittedAt', a.submitted_at,
        'title', s.title,
        'versionNumber', v.version_number
      ) order by a.submitted_at desc nulls first)
      from (
        select *
        from public.attempts
        where group_id = p_group_id
        order by submitted_at desc nulls first
        limit 50
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
