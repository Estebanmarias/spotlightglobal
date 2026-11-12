create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

create table if not exists push_messages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  url text not null default '/',
  send_on date not null,
  sent_at timestamptz,
  sent_count int,
  created_at timestamptz default now()
);
create index if not exists push_messages_due on push_messages (send_on) where sent_at is null;

alter table push_subscriptions enable row level security;
alter table push_messages enable row level security;
revoke all on push_subscriptions, push_messages from anon, authenticated;