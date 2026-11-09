-- Tab Archive: groups (exhibition rooms) and links (exhibits), one set per
-- account. Row level security keeps every row to its owner. The browser
-- extension has no Supabase session, so it signs captures with a personal
-- capture token instead (capture_tabs below, docs/decisions.md D3).

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------- groups
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  color text not null default 'none'
    check (color in ('none', 'grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange')),
  position double precision not null default 0,
  collapsed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create index groups_user_idx on public.groups (user_id, position);

-- ----------------------------------------------------------------- links
create table public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  group_id uuid,
  url text not null check (url ~ '^https?://' and char_length(url) <= 4096),
  title text not null default '' check (char_length(title) <= 1000),
  note text not null default '' check (char_length(note) <= 4000),
  tags text[] not null default '{}' check (cardinality(tags) <= 30),
  description text not null default '' check (char_length(description) <= 2000),
  image text check (char_length(image) <= 4096),
  icon text check (char_length(icon) <= 4096),
  meta_fetched_at timestamptz,
  position double precision not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, url),
  -- A link can only sit in a group of the same account; deleting the group
  -- leaves the link ungrouped.
  foreign key (group_id, user_id) references public.groups (id, user_id)
    on delete set null (group_id)
);
create index links_user_idx on public.links (user_id, position);
create index links_group_idx on public.links (group_id);

-- -------------------------------------------------------- capture tokens
create table public.capture_tokens (
  user_id uuid primary key references auth.users on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

-- ------------------------------------------------------------------- RLS
alter table public.groups enable row level security;
alter table public.links enable row level security;
alter table public.capture_tokens enable row level security;

create policy "own groups" on public.groups for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own links" on public.links for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
-- Tokens are only read (to show "created on") and deleted directly;
-- creating one goes through create_capture_token().
create policy "read own token" on public.capture_tokens for select to authenticated
  using (user_id = (select auth.uid()));
create policy "delete own token" on public.capture_tokens for delete to authenticated
  using (user_id = (select auth.uid()));

-- ------------------------------------------------------------- functions

-- A new capture token for the signed-in account (replaces the old one).
-- Only its hash is stored; the token itself is shown once.
create function public.create_capture_token()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  token text;
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  token := 'tab_' || encode(extensions.gen_random_bytes(24), 'hex');
  insert into public.capture_tokens (user_id, token_hash)
  values (uid, encode(extensions.digest(token, 'sha256'), 'hex'))
  on conflict (user_id) do update
    set token_hash = excluded.token_hash, created_at = now(), last_used_at = null;
  return token;
end;
$$;

-- Saves tabs sent by the extension. Tabs in a browser tab group go to the
-- group of the same name (created when missing); the rest go to p_inbox.
-- URLs already saved are skipped.
create function public.capture_tabs(p_token text, p_tabs jsonb, p_inbox text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
  tab jsonb;
  tab_url text;
  group_name text;
  group_color text;
  gid uuid;
  ordinal int := 0;
  added int := 0;
  dup int := 0;
  grouped int := 0;
  base double precision := extract(epoch from now());
begin
  if p_token is null or char_length(p_token) < 20 then
    raise exception 'invalid token' using errcode = '28000';
  end if;
  select user_id into uid from public.capture_tokens
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');
  if uid is null then
    raise exception 'invalid token' using errcode = '28000';
  end if;
  if jsonb_typeof(p_tabs) <> 'array' or jsonb_array_length(p_tabs) > 1000 then
    raise exception 'bad tabs' using errcode = '22023';
  end if;

  for tab in select value from jsonb_array_elements(p_tabs) loop
    ordinal := ordinal + 1;
    tab_url := tab ->> 'url';
    if tab_url is null or tab_url !~ '^https?://' or char_length(tab_url) > 4096 then
      continue;
    end if;
    if exists (select 1 from public.links where user_id = uid and url = tab_url) then
      dup := dup + 1;
      continue;
    end if;

    group_name := nullif(btrim(left(tab ->> 'group', 120)), '');
    group_color := coalesce(tab ->> 'color', 'grey');
    if group_name is not null then
      grouped := grouped + 1;
    else
      group_name := coalesce(nullif(btrim(left(p_inbox, 120)), ''), 'Inbox');
      group_color := 'none';
    end if;
    if group_color not in ('none', 'grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan', 'orange') then
      group_color := 'grey';
    end if;

    select id into gid from public.groups where user_id = uid and name = group_name
    order by position limit 1;
    if gid is null then
      insert into public.groups (user_id, name, color, position)
      values (uid, group_name, group_color,
        (select coalesce(min(position), 0) - 1 from public.groups where user_id = uid))
      returning id into gid;
    end if;

    insert into public.links (user_id, group_id, url, title, icon, position)
    values (
      uid, gid, tab_url,
      left(coalesce(nullif(tab ->> 'title', ''), tab_url), 1000),
      case when tab ->> 'icon' ~ '^https://' then left(tab ->> 'icon', 4096) end,
      base + ordinal / 10000.0
    )
    on conflict (user_id, url) do nothing;
    if found then added := added + 1; else dup := dup + 1; end if;
    gid := null;
  end loop;

  update public.capture_tokens set last_used_at = now() where user_id = uid;
  return jsonb_build_object('added', added, 'dup', dup, 'grouped', grouped);
end;
$$;

-- Deletes the signed-in account and, through the cascades, all its data.
create function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.create_capture_token() from public, anon;
revoke all on function public.capture_tabs(text, jsonb, text) from public;
revoke all on function public.delete_own_account() from public, anon;
grant execute on function public.create_capture_token() to authenticated;
grant execute on function public.capture_tabs(text, jsonb, text) to anon, authenticated;
grant execute on function public.delete_own_account() to authenticated;
