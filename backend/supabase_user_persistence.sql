create extension if not exists vector;

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  storage_path text,
  file_name text,
  file_size bigint default 0,
  total_chunks integer default 0,
  created_at timestamptz default now()
);

alter table public.documents
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists storage_path text,
  add column if not exists file_name text,
  add column if not exists file_size bigint default 0,
  add column if not exists total_chunks integer default 0,
  add column if not exists created_at timestamptz default now();

create table if not exists public.chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  content text,
  embedding vector(1536),
  file_id text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.chunks
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists document_id uuid references public.documents(id) on delete cascade,
  add column if not exists content text,
  add column if not exists file_id text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists created_at timestamptz default now();

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  document_id uuid references public.documents(id) on delete cascade,
  title text default 'New Chat',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.conversations
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists document_id uuid references public.documents(id) on delete cascade,
  add column if not exists title text default 'New Chat',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources jsonb,
  created_at timestamptz default now()
);

alter table public.messages
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists conversation_id uuid references public.conversations(id) on delete cascade,
  add column if not exists role text,
  add column if not exists content text,
  add column if not exists sources jsonb,
  add column if not exists created_at timestamptz default now();

create index if not exists documents_user_id_created_at_idx
  on public.documents(user_id, created_at desc);

create index if not exists conversations_user_document_updated_idx
  on public.conversations(user_id, document_id, updated_at desc);

create index if not exists messages_user_conversation_created_idx
  on public.messages(user_id, conversation_id, created_at asc);

create index if not exists chunks_document_id_idx
  on public.chunks(document_id);
