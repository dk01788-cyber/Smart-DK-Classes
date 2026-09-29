-- Run once in Supabase SQL Editor if the deployed website still shows the old support email.
-- This changes ONLY the public support email. It does NOT change the protected admin login email.
update public.site_settings
set support_email = 'smartdkclasses.help@gmail.com'
where id = 1;
