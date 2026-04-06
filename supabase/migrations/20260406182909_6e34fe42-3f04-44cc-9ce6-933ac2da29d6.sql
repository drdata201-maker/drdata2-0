
-- Add dataset_summary column to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS dataset_summary jsonb DEFAULT NULL;

-- Drop old check constraint if exists and add updated one
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check 
  CHECK (status IN ('draft', 'active', 'data_uploaded', 'analysis_running', 'completed', 'archived'));
