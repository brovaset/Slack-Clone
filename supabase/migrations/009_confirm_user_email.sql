-- Manually confirm a user when the dashboard toggle did not set email_confirmed_at.
-- Run in Supabase Dashboard → SQL Editor. Replace the email below.

UPDATE auth.users
SET email_confirmed_at = timezone('utc', now())
WHERE email = 'your@email.com'
  AND email_confirmed_at IS NULL;

-- Verify (should show a timestamp, not null):
-- SELECT id, email, email_confirmed_at, created_at FROM auth.users WHERE email = 'your@email.com';
