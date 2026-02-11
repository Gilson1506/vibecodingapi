// Script para criar usuário admin
// Uso: node create-admin.js email@exemplo.com senha123

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Credenciais do Supabase não configuradas no .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createAdmin() {
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
        console.log('Uso: npx tsx create-admin.ts email@exemplo.com senha123');
        process.exit(1);
    }

    console.log(`\n🔧 Criando admin: ${email}\n`);

    try {
        // 1. Criar usuário no Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (authError) {
            throw authError;
        }

        console.log('✅ Usuário criado no Auth:', authData.user?.id);

        // 2. Criar/atualizar registro na tabela users
        const { error: userError } = await supabase
            .from('users')
            .upsert({
                id: authData.user?.id,
                email,
                name: 'Administrador',
                role: 'admin',
                has_access: true,
                created_at: new Date().toISOString()
            });

        if (userError) {
            throw userError;
        }

        console.log('✅ Registro criado na tabela users com role=admin');
        console.log('\n🎉 Admin criado com sucesso!');
        console.log(`\n📧 Email: ${email}`);
        console.log(`🔑 Senha: ${password}`);
        console.log('\n🔗 Acesse: http://localhost:5175');

    } catch (error: any) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

createAdmin();
