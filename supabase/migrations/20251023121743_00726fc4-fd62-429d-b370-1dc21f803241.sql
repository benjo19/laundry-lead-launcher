-- Add super admin role for benjamindaka@hotmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('5750a3cc-ed90-40a3-89e1-de4bd7280678', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;