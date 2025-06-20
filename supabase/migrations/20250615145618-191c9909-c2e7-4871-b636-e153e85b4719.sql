
-- Enable Row Level Security on tables
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access to posts
CREATE POLICY "Allow public read access to posts"
ON public.posts FOR SELECT
USING (true);

-- Create policies to allow public read access to profiles
CREATE POLICY "Allow public read access to profiles"
ON public.profiles FOR SELECT
USING (true);

-- Create policies to allow public read access to likes
CREATE POLICY "Allow public read access to likes"
ON public.likes FOR SELECT
USING (true);

-- Create policies to allow public read access to comments
CREATE POLICY "Allow public read access to comments"
ON public.comments FOR SELECT
USING (true);
