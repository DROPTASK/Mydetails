-- Supabase Migration: 010_admin_projects.sql
-- Admin project explorer with folder/file hierarchy accessible to all visitors

CREATE TABLE IF NOT EXISTS public.project_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  path text NOT NULL,
  parent_path text NOT NULL DEFAULT '/',
  type text NOT NULL CHECK (type IN ('folder', 'file')),
  content text,
  file_url text,
  mime_type text DEFAULT 'text/plain',
  size_bytes bigint DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_nodes_path ON public.project_nodes (path);
CREATE INDEX IF NOT EXISTS idx_project_nodes_parent ON public.project_nodes (parent_path);

-- Enable RLS
ALTER TABLE public.project_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_project_nodes" ON public.project_nodes;
DROP POLICY IF EXISTS "public_insert_project_nodes" ON public.project_nodes;
DROP POLICY IF EXISTS "public_update_project_nodes" ON public.project_nodes;
DROP POLICY IF EXISTS "public_delete_project_nodes" ON public.project_nodes;

-- Public can read all projects
CREATE POLICY "public_select_project_nodes"
  ON public.project_nodes FOR SELECT
  TO anon, authenticated
  USING (true);

-- Any authenticated or anonymous client can insert/update/delete (validated client-side with admin session)
CREATE POLICY "public_insert_project_nodes"
  ON public.project_nodes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "public_update_project_nodes"
  ON public.project_nodes FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "public_delete_project_nodes"
  ON public.project_nodes FOR DELETE
  TO anon, authenticated
  USING (true);

-- Enable Supabase Realtime for project_nodes
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.project_nodes;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
