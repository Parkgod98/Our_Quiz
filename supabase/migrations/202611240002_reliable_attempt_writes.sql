create or replace function public.start_or_resume_attempt(p_version_id uuid, p_group_id uuid default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_attempt_id uuid;
  v_responses jsonb := '{}'::jsonb;
  v_flagged jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.can_access_version(p_version_id) then raise exception 'version access denied'; end if;
  if p_group_id is not null and (
    not public.is_group_member(p_group_id)
    or not exists(select 1 from public.group_question_sets where group_id = p_group_id and version_id = p_version_id)
  ) then
    raise exception 'group version access denied';
  end if;

  -- Resume is shared by multiple tabs, including simultaneous first opens.
  perform pg_advisory_xact_lock(hashtextextended(
    auth.uid()::text || ':' || p_version_id::text || ':' || coalesce(p_group_id::text, 'personal'), 0
  ));

  select id into v_attempt_id
  from public.attempts
  where user_id = auth.uid()
    and version_id = p_version_id
    and group_id is not distinct from p_group_id
    and submitted_at is null
  order by started_at desc
  limit 1;

  if v_attempt_id is null then
    insert into public.attempts(version_id, user_id, group_id, total)
    values(
      p_version_id,
      auth.uid(),
      p_group_id,
      (select count(*) from public.questions where version_id = p_version_id)
    )
    returning id into v_attempt_id;
  end if;

  select
    coalesce(jsonb_object_agg(q.question_key, aa.submitted_answer) filter (where aa.submitted_answer is not null), '{}'::jsonb),
    coalesce(jsonb_agg(q.question_key order by q.order_index) filter (where aa.is_flagged), '[]'::jsonb)
  into v_responses, v_flagged
  from public.attempt_answers aa
  join public.questions q on q.id = aa.question_id
  where aa.attempt_id = v_attempt_id;

  return jsonb_build_object(
    'attemptId', v_attempt_id,
    'responses', v_responses,
    'flaggedQuestionIds', v_flagged
  );
end;
$$;

grant execute on function public.start_or_resume_attempt(uuid, uuid) to authenticated;

create or replace function public.save_attempt_response(p_attempt_id uuid, p_question_key text, p_response jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_question_id uuid;
begin
  perform 1 from public.attempts
  where id = p_attempt_id and user_id = auth.uid() and submitted_at is null
  for update;
  if not found then raise exception 'editable attempt not found'; end if;

  select q.id into v_question_id
  from public.questions q
  join public.attempts a on a.version_id = q.version_id
  where a.id = p_attempt_id and q.question_key = p_question_key;

  if v_question_id is null then raise exception 'question not found in attempt'; end if;

  insert into public.attempt_answers(attempt_id, question_id, submitted_answer, is_correct, answered_at)
  values(p_attempt_id, v_question_id, p_response, null, now())
  on conflict(attempt_id, question_id) do update
  set submitted_answer = excluded.submitted_answer,
      is_correct = null,
      answered_at = now();

  update public.attempts set updated_at = now() where id = p_attempt_id;
end;
$$;

grant execute on function public.save_attempt_response(uuid, text, jsonb) to authenticated;

create or replace function public.set_attempt_flag(p_attempt_id uuid, p_question_key text, p_flagged boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_question_id uuid;
begin
  perform 1 from public.attempts
  where id = p_attempt_id and user_id = auth.uid() and submitted_at is null
  for update;
  if not found then raise exception 'editable attempt not found'; end if;

  select q.id into v_question_id
  from public.questions q
  join public.attempts a on a.version_id = q.version_id
  where a.id = p_attempt_id and q.question_key = p_question_key;

  if v_question_id is null then raise exception 'question not found in attempt'; end if;

  insert into public.attempt_answers(attempt_id, question_id, submitted_answer, is_correct, is_flagged, answered_at)
  values(p_attempt_id, v_question_id, null, null, p_flagged, now())
  on conflict(attempt_id, question_id) do update set is_flagged = excluded.is_flagged;

  update public.attempts set updated_at = now() where id = p_attempt_id;
end;
$$;

grant execute on function public.set_attempt_flag(uuid, text, boolean) to authenticated;

create or replace function public.submit_existing_attempt(p_attempt_id uuid, p_responses jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_version_id uuid;
  v_total integer;
  v_score integer;
  v_submitted_at timestamptz;
  v_q record;
  v_response jsonb;
  v_saved_response jsonb;
  v_correct boolean;
  v_results jsonb := '[]'::jsonb;
  v_received text[];
  v_expected text[];
begin
  select version_id, total, submitted_at, score
  into v_version_id, v_total, v_submitted_at, v_score
  from public.attempts
  where id = p_attempt_id and user_id = auth.uid()
  for update;

  if not found then raise exception 'editable attempt not found'; end if;
  if v_submitted_at is not null then
    -- A successful submission may lose its HTTP response. Reuse its stored grade.
    select coalesce(jsonb_agg(jsonb_build_object(
      'questionId', q.question_key,
      'correct', aa.is_correct,
      'explanation', answer.explanation
    ) order by q.order_index), '[]'::jsonb) into v_results
    from public.attempt_answers aa
    join public.questions q on q.id = aa.question_id
    join public.question_answers answer on answer.question_id = q.id
    where aa.attempt_id = p_attempt_id;
    return jsonb_build_object('attemptId', p_attempt_id, 'score', v_score, 'total', v_total, 'results', v_results);
  end if;
  v_score := 0;

  for v_q in
    select q.id, q.question_key, q.type, a.answer, a.explanation
    from public.questions q
    join public.question_answers a on a.question_id = q.id
    where q.version_id = v_version_id
    order by q.order_index
  loop
    select submitted_answer into v_saved_response
    from public.attempt_answers
    where attempt_id = p_attempt_id and question_id = v_q.id;

    if p_responses ? v_q.question_key then
      v_response := p_responses -> v_q.question_key;
    else
      v_response := v_saved_response;
    end if;

    v_correct := false;
    if v_response is not null then
      if v_q.type in ('single_choice', 'true_false', 'ordering') then
        v_correct := coalesce(v_response = v_q.answer, false);
      elsif v_q.type = 'multiple_choice' then
        select coalesce(array_agg(value order by value), array[]::text[])
          into v_received
          from jsonb_array_elements_text(case when jsonb_typeof(v_response) = 'array' then v_response else '[]'::jsonb end);
        select coalesce(array_agg(value order by value), array[]::text[])
          into v_expected
          from jsonb_array_elements_text(v_q.answer);
        v_correct := v_received = v_expected;
      elsif v_q.type = 'short_answer' and jsonb_typeof(v_response) = 'string' then
        v_correct := exists(
          select 1 from jsonb_array_elements_text(v_q.answer) accepted
          where lower(trim(accepted)) = lower(trim(v_response #>> '{}'))
        );
      end if;
    end if;

    if v_correct then v_score := v_score + 1; end if;

    insert into public.attempt_answers(attempt_id, question_id, submitted_answer, is_correct, answered_at)
    values(p_attempt_id, v_q.id, v_response, v_correct, now())
    on conflict(attempt_id, question_id) do update
      set submitted_answer = excluded.submitted_answer,
          is_correct = excluded.is_correct,
          answered_at = now();

    v_results := v_results || jsonb_build_array(jsonb_build_object(
      'questionId', v_q.question_key,
      'correct', v_correct,
      'explanation', v_q.explanation
    ));
  end loop;

  update public.attempts
  set submitted_at = now(), score = v_score, updated_at = now()
  where id = p_attempt_id;

  return jsonb_build_object('attemptId', p_attempt_id, 'score', v_score, 'total', v_total, 'results', v_results);
end;
$$;

grant execute on function public.submit_existing_attempt(uuid, jsonb) to authenticated;
