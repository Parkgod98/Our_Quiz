create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.study_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  invite_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table public.question_sets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  portable_set_id text not null,
  title text not null,
  subject text not null,
  week_number integer not null check (week_number >= 1),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, portable_set_id)
);

create table public.question_set_versions (
  id uuid primary key default gen_random_uuid(),
  question_set_id uuid not null references public.question_sets(id) on delete cascade,
  version_number integer not null check (version_number >= 1),
  schema_version text not null default '1.0',
  question_count integer not null default 0,
  created_by uuid not null references auth.users(id) on delete cascade,
  published_at timestamptz not null default now(),
  unique (question_set_id, version_number)
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.question_set_versions(id) on delete cascade,
  question_key text not null,
  type text not null check (type in ('single_choice','multiple_choice','true_false','short_answer','ordering')),
  topic text not null,
  difficulty integer not null check (difficulty between 1 and 5),
  prompt text not null,
  choices jsonb,
  items jsonb,
  order_index integer not null,
  unique (version_id, question_key)
);

create table public.question_answers (
  question_id uuid primary key references public.questions(id) on delete cascade,
  answer jsonb not null,
  explanation text not null
);

create table public.group_question_sets (
  group_id uuid not null references public.study_groups(id) on delete cascade,
  version_id uuid not null references public.question_set_versions(id) on delete cascade,
  assigned_by uuid not null references auth.users(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (group_id, version_id)
);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.question_set_versions(id),
  user_id uuid not null references auth.users(id) on delete cascade,
  group_id uuid references public.study_groups(id) on delete set null,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score integer,
  total integer not null default 0
);

create table public.attempt_answers (
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  submitted_answer jsonb,
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  primary key (attempt_id, question_id)
);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  insert into public.profiles(id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_group_member(p_group_id uuid) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists(select 1 from public.group_members gm where gm.group_id = p_group_id and gm.user_id = auth.uid());
$$;

create or replace function public.can_access_version(p_version_id uuid) returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists(
    select 1 from public.question_set_versions v join public.question_sets s on s.id = v.question_set_id
    where v.id = p_version_id and (
      s.owner_id = auth.uid() or exists(
        select 1 from public.group_question_sets gqs join public.group_members gm on gm.group_id = gqs.group_id
        where gqs.version_id = v.id and gm.user_id = auth.uid()
      )
    )
  );
$$;

alter table public.profiles enable row level security;
alter table public.study_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.question_sets enable row level security;
alter table public.question_set_versions enable row level security;
alter table public.questions enable row level security;
alter table public.question_answers enable row level security;
alter table public.group_question_sets enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_answers enable row level security;

create policy "profiles readable by authenticated" on public.profiles for select to authenticated using (true);
create policy "profile owner updates self" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "group members read groups" on public.study_groups for select to authenticated using (public.is_group_member(id) or created_by = auth.uid());
create policy "users create groups" on public.study_groups for insert to authenticated with check (created_by = auth.uid());
create policy "group owner updates group" on public.study_groups for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy "members read memberships" on public.group_members for select to authenticated using (public.is_group_member(group_id));
create policy "group creator adds initial member" on public.group_members for insert to authenticated with check (user_id = auth.uid() and exists(select 1 from public.study_groups g where g.id = group_id and g.created_by = auth.uid()));

create policy "accessible question sets readable" on public.question_sets for select to authenticated using (owner_id = auth.uid() or exists(select 1 from public.question_set_versions v where v.question_set_id = id and public.can_access_version(v.id)));
create policy "owner creates question sets" on public.question_sets for insert to authenticated with check (owner_id = auth.uid());
create policy "owner updates question sets" on public.question_sets for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "accessible versions readable" on public.question_set_versions for select to authenticated using (public.can_access_version(id));
create policy "owner creates versions" on public.question_set_versions for insert to authenticated with check (created_by = auth.uid() and exists(select 1 from public.question_sets s where s.id = question_set_id and s.owner_id = auth.uid()));

create policy "accessible questions readable" on public.questions for select to authenticated using (public.can_access_version(version_id));
create policy "owner inserts questions" on public.questions for insert to authenticated with check (exists(select 1 from public.question_set_versions v join public.question_sets s on s.id=v.question_set_id where v.id=version_id and s.owner_id=auth.uid()));

create policy "owner reads answers" on public.question_answers for select to authenticated using (exists(select 1 from public.questions q join public.question_set_versions v on v.id=q.version_id join public.question_sets s on s.id=v.question_set_id where q.id=question_id and s.owner_id=auth.uid()));
create policy "owner inserts answers" on public.question_answers for insert to authenticated with check (exists(select 1 from public.questions q join public.question_set_versions v on v.id=q.version_id join public.question_sets s on s.id=v.question_set_id where q.id=question_id and s.owner_id=auth.uid()));

create policy "members read assignments" on public.group_question_sets for select to authenticated using (public.is_group_member(group_id));
create policy "group owner assigns versions" on public.group_question_sets for insert to authenticated with check (assigned_by=auth.uid() and exists(select 1 from public.study_groups g where g.id=group_id and g.created_by=auth.uid()) and public.can_access_version(version_id));

create policy "own or group attempts readable" on public.attempts for select to authenticated using (user_id=auth.uid() or (group_id is not null and public.is_group_member(group_id)));
create policy "own attempt answers readable" on public.attempt_answers for select to authenticated using (exists(select 1 from public.attempts a where a.id=attempt_id and a.user_id=auth.uid()));

create or replace function public.join_group_by_code(p_code text) returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare v_group_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select id into v_group_id from public.study_groups where invite_code = upper(trim(p_code));
  if v_group_id is null then raise exception 'invalid invite code'; end if;
  insert into public.group_members(group_id,user_id,role) values(v_group_id,auth.uid(),'member') on conflict do nothing;
  return v_group_id;
end;
$$;

grant execute on function public.join_group_by_code(text) to authenticated;

create or replace function public.import_question_set(p_payload jsonb) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_set_id uuid;
  v_version_id uuid;
  v_q record;
  v_question_id uuid;
  v_count integer;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  v_count := jsonb_array_length(p_payload->'questions');
  insert into public.question_sets(owner_id,portable_set_id,title,subject,week_number,description)
  values(auth.uid(),p_payload->>'setId',p_payload->>'title',p_payload->>'subject',(p_payload->>'week')::integer,p_payload->>'description')
  on conflict(owner_id,portable_set_id) do update set title=excluded.title,subject=excluded.subject,week_number=excluded.week_number,description=excluded.description,updated_at=now()
  returning id into v_set_id;

  insert into public.question_set_versions(question_set_id,version_number,schema_version,question_count,created_by)
  values(v_set_id,(p_payload->>'version')::integer,p_payload->>'schemaVersion',v_count,auth.uid()) returning id into v_version_id;

  for v_q in select value, ordinality from jsonb_array_elements(p_payload->'questions') with ordinality loop
    insert into public.questions(version_id,question_key,type,topic,difficulty,prompt,choices,items,order_index)
    values(v_version_id,v_q.value->>'id',v_q.value->>'type',v_q.value->>'topic',(v_q.value->>'difficulty')::integer,v_q.value->>'prompt',v_q.value->'choices',v_q.value->'items',v_q.ordinality::integer)
    returning id into v_question_id;
    insert into public.question_answers(question_id,answer,explanation) values(v_question_id,v_q.value->'answer',v_q.value->>'explanation');
  end loop;
  return jsonb_build_object('questionSetId',v_set_id,'versionId',v_version_id,'questionCount',v_count);
end;
$$;

grant execute on function public.import_question_set(jsonb) to authenticated;

create or replace function public.export_question_set(p_version_id uuid) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_result jsonb;
begin
  if not exists(select 1 from public.question_set_versions v join public.question_sets s on s.id=v.question_set_id where v.id=p_version_id and s.owner_id=auth.uid()) then raise exception 'owner permission required'; end if;
  select jsonb_build_object(
    'schemaVersion',v.schema_version,'setId',s.portable_set_id,'title',s.title,'subject',s.subject,'week',s.week_number,'version',v.version_number,'description',s.description,
    'questions',coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',q.question_key,'type',q.type,'topic',q.topic,'difficulty',q.difficulty,'prompt',q.prompt,'choices',q.choices,'items',q.items,'answer',a.answer,'explanation',a.explanation)) order by q.order_index),'[]'::jsonb)
  ) into v_result
  from public.question_set_versions v join public.question_sets s on s.id=v.question_set_id join public.questions q on q.version_id=v.id join public.question_answers a on a.question_id=q.id
  where v.id=p_version_id group by v.id,s.id;
  return v_result;
end;
$$;

grant execute on function public.export_question_set(uuid) to authenticated;

create or replace function public.submit_attempt(p_version_id uuid,p_responses jsonb,p_group_id uuid default null) returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_attempt_id uuid;
  v_total integer;
  v_score integer := 0;
  v_q record;
  v_response jsonb;
  v_correct boolean;
  v_results jsonb := '[]'::jsonb;
  v_received text[];
  v_expected text[];
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.can_access_version(p_version_id) then raise exception 'version access denied'; end if;
  if p_group_id is not null and (not public.is_group_member(p_group_id) or not exists(select 1 from public.group_question_sets where group_id=p_group_id and version_id=p_version_id)) then raise exception 'group version access denied'; end if;

  select count(*) into v_total from public.questions where version_id=p_version_id;
  insert into public.attempts(version_id,user_id,group_id,total) values(p_version_id,auth.uid(),p_group_id,v_total) returning id into v_attempt_id;

  for v_q in select q.id,q.question_key,q.type,a.answer,a.explanation from public.questions q join public.question_answers a on a.question_id=q.id where q.version_id=p_version_id order by q.order_index loop
    v_response := p_responses -> v_q.question_key;
    v_correct := false;
    if v_q.type in ('single_choice','true_false','ordering') then
      v_correct := coalesce(v_response = v_q.answer,false);
    elsif v_q.type='multiple_choice' then
      select coalesce(array_agg(value order by value),array[]::text[]) into v_received from jsonb_array_elements_text(case when jsonb_typeof(v_response)='array' then v_response else '[]'::jsonb end);
      select coalesce(array_agg(value order by value),array[]::text[]) into v_expected from jsonb_array_elements_text(v_q.answer);
      v_correct := v_received=v_expected;
    elsif v_q.type='short_answer' then
      if jsonb_typeof(v_response)='string' then
        v_correct := exists(select 1 from jsonb_array_elements_text(v_q.answer) accepted where lower(trim(accepted))=lower(trim(v_response #>> '{}')));
      end if;
    end if;
    if v_correct then v_score := v_score + 1; end if;
    insert into public.attempt_answers(attempt_id,question_id,submitted_answer,is_correct) values(v_attempt_id,v_q.id,v_response,v_correct);
    v_results := v_results || jsonb_build_array(jsonb_build_object('questionId',v_q.question_key,'correct',v_correct,'explanation',v_q.explanation));
  end loop;

  update public.attempts set submitted_at=now(),score=v_score where id=v_attempt_id;
  return jsonb_build_object('attemptId',v_attempt_id,'score',v_score,'total',v_total,'results',v_results);
end;
$$;

grant execute on function public.submit_attempt(uuid,jsonb,uuid) to authenticated;
