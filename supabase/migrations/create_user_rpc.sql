-- RPC Function para criar usuário de forma atômica
-- Esta função cria um registro em public.users se não existir

CREATE OR REPLACE FUNCTION public.create_user_after_payment(
    p_user_id UUID,
    p_email TEXT,
    p_full_name TEXT,
    p_phone TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
BEGIN
    -- Verificar se o usuário já existe
    SELECT * INTO v_user FROM public.users WHERE id = p_user_id OR email ILIKE p_email LIMIT 1;
    
    IF FOUND THEN
        -- Usuário existe, atualizar acesso
        UPDATE public.users 
        SET has_access = true, updated_at = NOW()
        WHERE id = v_user.id;
        
        RETURN json_build_object(
            'success', true,
            'created', false,
            'user_id', v_user.id,
            'message', 'User already exists, access granted'
        );
    END IF;
    
    -- Criar novo usuário
    INSERT INTO public.users (id, email, full_name, phone, role, has_access, created_at, updated_at)
    VALUES (p_user_id, p_email, p_full_name, p_phone, 'student', true, NOW(), NOW())
    RETURNING * INTO v_user;
    
    RETURN json_build_object(
        'success', true,
        'created', true,
        'user_id', v_user.id,
        'message', 'User created successfully'
    );
    
EXCEPTION WHEN unique_violation THEN
    -- Caso de race condition, tenta buscar o usuário novamente
    SELECT * INTO v_user FROM public.users WHERE id = p_user_id OR email ILIKE p_email LIMIT 1;
    
    IF FOUND THEN
        UPDATE public.users SET has_access = true WHERE id = v_user.id;
        RETURN json_build_object(
            'success', true,
            'created', false,
            'user_id', v_user.id,
            'message', 'User found after race condition'
        );
    END IF;
    
    RETURN json_build_object(
        'success', false,
        'created', false,
        'user_id', NULL,
        'message', 'Failed to create or find user'
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_user_after_payment TO service_role;
