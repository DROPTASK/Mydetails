-- Email notification settings (admin's notify address + on/off toggles).
-- NOTE: actual SMTP host/username/password are NEVER stored here — they live
-- only as Supabase Edge Function secrets (see supabase/functions/send-email).
-- This table is public-readable via the anon key, so it must never hold credentials.
INSERT INTO public.admin_settings (key, value)
VALUES ('notifications', '{"admin_email": "", "notify_admin_on_message": true, "notify_user_on_reply": true}'::jsonb)
ON CONFLICT (key) DO NOTHING;
