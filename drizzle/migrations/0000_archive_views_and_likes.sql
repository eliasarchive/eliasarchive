-- Global view counter (single row)
CREATE TABLE public.site_counters (
  id text PRIMARY KEY,
  value bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_counters TO anon, authenticated;
GRANT ALL ON public.site_counters TO service_role;

ALTER TABLE public.site_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Counters are publicly readable"
ON public.site_counters FOR SELECT
TO anon, authenticated
USING (true);

INSERT INTO public.site_counters (id, value) VALUES ('views', 0);

-- One like (and optional comment) per visitor
CREATE TABLE public.archive_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id text NOT NULL UNIQUE,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.archive_likes TO anon, authenticated;
GRANT ALL ON public.archive_likes TO service_role;

ALTER TABLE public.archive_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are publicly readable"
ON public.archive_likes FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone may leave one like"
ON public.archive_likes FOR INSERT
TO anon, authenticated
WITH CHECK (char_length(coalesce(message, '')) <= 160 AND char_length(visitor_id) BETWEEN 8 AND 64);

-- Increment and return the global view count
CREATE OR REPLACE FUNCTION public.increment_views()
RETURNS bigint
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.site_counters (id, value)
  VALUES ('views', 1)
  ON CONFLICT (id) DO UPDATE SET value = public.site_counters.value + 1, updated_at = now()
  RETURNING value;
$$;

GRANT EXECUTE ON FUNCTION public.increment_views() TO anon, authenticated;