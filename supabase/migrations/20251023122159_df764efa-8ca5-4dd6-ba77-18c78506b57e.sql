-- Change mateoseba010@gmail.com from super_admin to user
UPDATE public.user_roles
SET role = 'user'
WHERE user_id = 'e2ce4e4a-fc66-4f62-af0d-7af4a93bb6da'
  AND role = 'super_admin';