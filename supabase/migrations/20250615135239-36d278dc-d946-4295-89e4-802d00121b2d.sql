
-- Create a new storage bucket for posts
insert into storage.buckets
  (id, name, public)
values
  ('posts', 'posts', true);

-- Add a policy to allow authenticated users to upload files to the 'posts' bucket
create policy "Authenticated users can upload to posts bucket"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'posts' );

-- Add a policy to allow anyone to view files in the 'posts' bucket
create policy "Anyone can see posts"
  on storage.objects for select
  using ( bucket_id = 'posts' );

