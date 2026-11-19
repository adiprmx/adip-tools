-- ADIP Tools: agregat pencarian global "Sering dicari"
-- Cara pakai: jalankan SELURUH file ini di Supabase Dashboard > SQL Editor.
-- Idempotent: aman dijalankan ulang.
-- Yang dibuat: tabel tool_search_terms + RPC track_search + RLS + realtime
--   + throttle anti-spam F4 (skema private, tabel track_search_throttle,
--   fungsi throttle_check) — deploy 18 Nov 2026, paket keamanan DB F4.
--   Definisi fungsi di bawah ini = yang live di proyek jebafddwupyqpwevhsqn
--   (disinkronkan dari pg_get_functiondef pasca-deploy, 19 Nov 2026).

-- 1) Tabel agregat (satu baris per term unik)
CREATE TABLE IF NOT EXISTS public.tool_search_terms (
  term text PRIMARY KEY,
  count integer NOT NULL DEFAULT 1 CHECK (count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Throttle anti-spam (F4, 18 Nov 2026): skema private + tabel bucket + helper.
--    Tabel throttle: RLS aktif, 0 policy = tolak semua via Data API;
--    hanya fungsi SECURITY DEFINER yang bisa menulisnya.
CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.track_search_throttle (
  bucket_key   text        NOT NULL,
  window_start timestamptz NOT NULL,
  hits         integer     NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket_key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_track_search_throttle_window
  ON private.track_search_throttle (window_start);

ALTER TABLE private.track_search_throttle ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON private.track_search_throttle FROM anon, authenticated, PUBLIC;

CREATE OR REPLACE FUNCTION private.throttle_check(
  p_key text, p_window interval, p_limit integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = private, public
AS $$
DECLARE
  v_start timestamptz;
  v_hits  integer;
BEGIN
  IF p_window = interval '1 hour' THEN
    v_start := date_trunc('hour', now());
  ELSIF p_window = interval '1 day' THEN
    v_start := date_trunc('day', now());
  ELSE
    v_start := date_trunc('hour', now());
  END IF;
  INSERT INTO private.track_search_throttle (bucket_key, window_start, hits)
  VALUES (p_key, v_start, 1)
  ON CONFLICT (bucket_key, window_start) DO UPDATE
    SET hits = private.track_search_throttle.hits + 1
  RETURNING hits INTO v_hits;
  RETURN v_hits <= p_limit;
END;
$$;

-- 3) RPC satu-satunya jalur tulis untuk anon (SECURITY DEFINER + validasi ketat
--    + throttle F4: per-IP 120/jam, per-istilah 5/jam dan 20/hari)
CREATE OR REPLACE FUNCTION public.track_search(p_term text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_term    text;
  v_ip      text;
  v_headers jsonb;
BEGIN
  v_term := lower(trim(p_term));
  IF v_term IS NULL OR char_length(v_term) < 2 OR char_length(v_term) > 40 THEN
    RETURN;
  END IF;
  -- hanya huruf latin/angka/spasi/dash (cukup untuk Bahasa Indonesia)
  IF v_term !~ '^[a-z0-9 \-]+$' THEN
    RETURN;
  END IF;
  -- Batas pertumbuhan (v6.12.1, Blue Team R1/F4): tolak istilah BARU bila
  -- tabel sudah > 5000 baris; istilah yang sudah ada tetap boleh naik count.
  -- Mencegah penghabisan kuota storage proyek bersama via spam istilah unik.
  IF NOT EXISTS (SELECT 1 FROM public.tool_search_terms WHERE term = v_term)
     AND (SELECT count(*) FROM public.tool_search_terms) > 5000 THEN
    RETURN;
  END IF;
  -- Throttle F4 (fail-open: bila ada error di blok ini, pencarian tetap jalan)
  BEGIN
    v_headers := nullif(current_setting('request.headers', true), '')::jsonb;
    v_ip := coalesce(
      nullif(v_headers ->> 'cf-connecting-ip', ''),
      nullif(split_part(v_headers ->> 'x-forwarded-for', ',', 1), '')
    );
    v_ip := left(v_ip, 45);
    IF v_ip IS NOT NULL
       AND NOT private.throttle_check('ip:' || v_ip, interval '1 hour', 120) THEN
      RETURN;
    END IF;
    IF NOT private.throttle_check('term:' || v_term, interval '1 hour', 5) THEN
      RETURN;
    END IF;
    IF NOT private.throttle_check('term:' || v_term, interval '1 day', 20) THEN
      RETURN;
    END IF;
    DELETE FROM private.track_search_throttle
    WHERE window_start < now() - interval '25 hours';
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  INSERT INTO public.tool_search_terms (term, count, updated_at)
  VALUES (v_term, 1, now())
  ON CONFLICT (term) DO UPDATE
    SET count = public.tool_search_terms.count + 1,
        updated_at = now();
END;
$$;

-- 4) RLS: anon boleh BACA, tidak boleh tulis langsung (tulis hanya via RPC)
ALTER TABLE public.tool_search_terms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tool_search_terms_select_anon" ON public.tool_search_terms;
CREATE POLICY "tool_search_terms_select_anon"
  ON public.tool_search_terms FOR SELECT
  TO anon
  USING (true);

GRANT EXECUTE ON FUNCTION public.track_search(text) TO anon;
GRANT EXECUTE ON FUNCTION public.track_search(text) TO authenticated;

-- 5) Realtime: ikutkan tabel ke publication supabase_realtime
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

-- 6) Verifikasi cepat (opsional): odkomentari untuk test
-- SELECT public.track_search('password');
-- SELECT public.track_search('password');
-- TABLE public.tool_search_terms;  -- harusnya: password | 2
