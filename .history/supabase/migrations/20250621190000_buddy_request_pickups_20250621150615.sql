CREATE TABLE IF NOT EXISTS buddy_request_pickups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc', now()),
    UNIQUE (post_id, user_id)
);

ALTER TABLE posts ADD COLUMN IF NOT EXISTS selected_buddy_id uuid REFERENCES profiles(id);
