-- Substitua 'seu_email_aqui' pelo seu email de login
UPDATE public.users 
SET role = 'admin', has_access = true 
WHERE email = 'seu_email_aqui';

-- Verifique se funcionou
SELECT * FROM public.users WHERE email = 'seu_email_aqui';
