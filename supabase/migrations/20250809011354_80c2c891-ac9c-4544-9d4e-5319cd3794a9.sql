-- Enable leaked password protection
UPDATE auth.config SET value = 'true' WHERE name = 'SECURITY_PASSWORD_LEAK_CHECK_ENABLED';