-- Create notifications table
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null, -- e.g. 'buddy_request', 'like', 'comment', etc.
  data jsonb,         -- extra info (post id, sender id, etc.)
  read boolean not null default false,
  created_at timestamp with time zone default timezone('utc', now())
);

npx supabase gen types typescript --project-id qnjmaybhricwuuuqvnun --schema public > src/integrations/supabase/types.ts

-- Index for fast lookup
create index if not exists idx_notifications_user_id on notifications(user_id);
create index if not exists idx_notifications_read on notifications(user_id, read);

-- RLS: Enable and allow only the recipient to read, and only server to insert
alter table notifications enable row level security;

-- Allow users to read their own notifications
create policy "Users can read their notifications" on notifications
  for select using (auth.uid() = user_id);

-- Allow users to update (mark as read) their own notifications
create policy "Users can update their notifications" on notifications
  for update using (auth.uid() = user_id);

-- (Optional) Allow server-side inserts (e.g. via service role)
-- You may want to restrict insert to service role only, or allow all for testing:
create policy "Allow all inserts (dev only)" on notifications
  for insert with check (true);
