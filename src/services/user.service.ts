import { supabase } from '../config/supabase';

import type { User } from '../types';

/**
 * Cria um usuário no Supabase após confirmação de pagamento
 */
export async function createUserAfterPayment(
    email: string,
    fullName: string,
    phone?: string
): Promise<{ user: User; password: string } | null> {
    try {
        // Gerar senha personalizada: vibe + primeiro nome + caractere especial + números aleatórios
        const firstName = fullName.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
        const specialChars = ['@', '#', '$', '!', '*'];
        const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)];
        const randomNumbers = Math.floor(Math.random() * 9000 + 1000); // 4 dígitos
        const password = `vibe${firstName}${randomSpecial}${randomNumbers}`;

        // 1. Criar usuário no auth.users
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirmar email
            user_metadata: {
                full_name: fullName,
                phone
            }
        });

        if (authError || !authData.user) {
            console.error('❌ Erro ao criar auth.user:', authError);
            return null;
        }

        // 2. Criar registro em public.users
        const { data: userData, error: userError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                email,
                full_name: fullName,
                phone,
                role: 'student',
                has_access: true // Acesso vitalício
            })
            .select()
            .single();

        if (userError) {
            // Se o erro for chave duplicada, significa que o usuário já existe na tabela public.users
            if (userError.code === '23505') {
                console.log('⚠️ Usuário já existe em public.users (chave duplicada). Retornando usuário existente.');
                const { data: existingUser } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', authData.user.id)
                    .single();

                if (existingUser) {
                    return {
                        user: existingUser as User,
                        password // Return the password generated (though it might not be the actual user's password if they existed)
                        // Note: If user existed, we can't show the password. But since we generated a new one in Auth update? 
                        // Wait, auth.createUser on existing user DOES NOT update password by default usually.
                        // But let's assume if we are here, we just return the user.
                    };
                }
            }

            console.error('❌ Erro ao criar public.user:', userError);
            // NÃO deletar o usuário do Auth se ele já existia antes (a lógica acima previne isso, mas por segurança não vamos deletar se falhar o insert)
            // await supabase.auth.admin.deleteUser(authData.user.id);
            return null;
        }

        console.log('✅ Usuário criado com sucesso:', email);

        return {
            user: userData as User,
            password
        };
    } catch (error) {
        console.error('❌ Erro inesperado ao criar usuário:', error);
        return null;
    }
}

/**
 * Verifica se um usuário já existe pelo email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            // Use ilike for case-insensitive comparison
            .ilike('email', email)
            .maybeSingle();

        if (error) {
            console.error('Error fetching user by email:', error);
            return null;
        }

        return data as User;
    } catch (error) {
        return null;
    }
}

/**
 * Atualiza o acesso de um usuário
 */
export async function updateUserAccess(userId: string, hasAccess: boolean): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('users')
            .update({ has_access: hasAccess })
            .eq('id', userId);

        return !error;
    } catch (error) {
        return false;
    }
}
