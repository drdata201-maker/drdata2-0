
ALTER TABLE public.profiles
ADD COLUMN preferred_language TEXT DEFAULT NULL,
ADD COLUMN preferred_theme TEXT DEFAULT NULL,
ADD COLUMN notification_preferences JSONB DEFAULT '{"email_reports": true, "analysis_complete": true, "weekly_summary": false}'::jsonb;
