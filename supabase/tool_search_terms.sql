-- ADIP Tools: agregat pencarian global "Sering dicari"
-- Cara pakai: jalankan SELURUH file ini di Supabase Dashboard > SQL Editor.
-- Idempotent: aman dijalankan ulang.
-- Yang dibuat: tabel tool_search_terms + RPC track_search + RLS + realtime.

-- 1) Tabel agregat (satu baris per term unik)
CREATE TABLE IF NOT EXISTS public.tool_search_terms (
  term text PRIMARY KEY,
  count integer NOT NULL DEFAULT 1 CHECK (count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) RPC satu-satunya jalur tulis untuk anon (SECURITY DEFINER + validasi ketat)
CREATE OR REPLACE FUNCTION public.track_search(p_term text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_term text;
BEGIN
  v_term := lower(trim(p_term));
  IF v_term IS NULL OR char_length(v_term) < 2 OR char_length(v_term) > 40 THEN
    RETURN;
  END IF;
  -- hanya huruf latin/angka/spasi/dash (cukup untuk Bahasa Indonesia)
  IF v_term !~ '^[a-z0-9 \-]+$' THEN
    RETURN;
  END IF;
  INSERT INTO public.tool_search_terms (term, count, updated_at)
  VALUES (v_term, 1, now())
  ON CONFLICT (term) DO UPDATE
    SET count = public.tool_search_terms.count + 1,
        updated_at = now();
END;
$$;

-- 3) RLS: anon boleh BACA, tidak boleh tulis langsung (tulis hanya via RPC)
ALTER TABLE public.tool_search_terms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tool_search_terms_select_anon" ON public.tool_search_terms;
CREATE POLICY "tool_search_terms_select_anon"
  ON public.tool_search_terms FOR SELECT
  TO anon
  USING (true);

GRANT EXECUTE ON FUNCTION public.track_search(text) TO anon;
GRANT EXECUTE ON FUNCTION public.track_search(text) TO authenticated;

-- 4) Realtime: ikutkan tabel ke publication supabase_realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'tool_search_terms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tool_search_terms;
  END IF;
END
$$;

-- 5) Verifikasi cepat (opsional): odkomentari untuk test
-- SELECT public.track_search('password');
-- SELECT public.track_search('password');
-- TABLE public.tool_search_terms;  -- harusnya: password | 2
