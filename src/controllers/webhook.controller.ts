import { Request, Response } from 'express';
import { updatePaymentStatus, getPaymentByExternalId } from '../services/payment.service';
import { createUserAfterPayment, getUserByEmail } from '../services/user.service';
import { sendWelcomeEmail } from '../services/email.service';
import { supabase } from '../config/supabase';

/**
 * Webhook do Appy Pay - Confirmação de pagamento
 */
export async function handleAppyPayWebhook(req: Request, res: Response) {
    try {
        console.log('📥 Webhook Appy Pay recebido:', req.body);

        const { externalId, status, paymentId } = req.body;

        // TODO: Validar assinatura do webhook com APPYPAY_WEBHOOK_SECRET

        if (status !== 'confirmed' && status !== 'paid') {
            console.log('⚠️ Status não é confirmado:', status);
            return res.json({ received: true });
        }

        // Buscar pagamento no banco
        const payment = await getPaymentByExternalId(externalId);

        if (!payment) {
            console.error('❌ Pagamento não encontrado:', externalId);
            return res.status(404).json({ error: 'Pagamento não encontrado' });
        }

        if (payment.status === 'confirmed') {
            console.log('⚠️ Pagamento já confirmado');
            return res.json({ received: true, message: 'Já processado' });
        }

        // 1. Verificar se usuário já existe
        let user = await getUserByEmail(payment.customerEmail);
        let password = '';

        if (!user) {
            // 2. Criar usuário
            const result = await createUserAfterPayment(
                payment.customerEmail,
                payment.customerName,
                payment.customerPhone
            );

            if (!result) {
                console.error('❌ Erro ao criar usuário');
                return res.status(500).json({ error: 'Erro ao criar usuário' });
            }

            user = result.user;
            password = result.password;

            console.log('✅ Usuário criado:', user.email);
        } else {
            console.log('ℹ️ Usuário já existe, apenas liberando acesso');
            // Se já existe, apenas garantir que tem acesso
            await supabase
                .from('users')
                .update({ has_access: true })
                .eq('id', user.id);
        }

        // 3. Atualizar pagamento
        await updatePaymentStatus(payment.id, 'confirmed', externalId, user.id);

        // 4. Enviar email de boas-vindas (apenas se criou novo usuário)
        if (password) {
            const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:5174';

            await sendWelcomeEmail({
                to: user.email,
                name: user.fullName,
                email: user.email,
                password,
                dashboardUrl
            });

            console.log('✅ Email de boas-vindas enviado');
        }

        res.json({
            success: true,
            message: 'Pagamento processado com sucesso'
        });
    } catch (error) {
        console.error('❌ Erro no webhook Appy Pay:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}

/**
 * Webhook do Mux - Status de assets e lives
 */
export async function handleMuxWebhook(req: Request, res: Response) {
    try {
        console.log('📥 Webhook Mux recebido:', req.body);

        const { type, data } = req.body;

        // TODO: Validar assinatura do webhook com MUX_WEBHOOK_SECRET

        switch (type) {
            case 'video.asset.ready':
                // Asset pronto para playback
                const assetId = data.id;
                const playbackId = data.playback_ids?.[0]?.id;
                const duration = data.duration;

                const uploadId = data.upload_id;

                // 1. Tentar atualizar pelo Asset ID (Fluxo normal)
                const { count } = await supabase
                    .from('lessons')
                    .update({
                        mux_status: 'ready',
                        mux_playback_id: playbackId,
                        duration_seconds: Math.floor(duration || 0)
                    })
                    .eq('mux_asset_id', assetId)
                    .select('count', { count: 'exact' }); // Precisamos do count

                // 2. Se não achou pelo Asset ID, tentar pelo Upload ID (Fluxo Fallback)
                if ((count === null || count === 0) && uploadId) {
                    console.log(`⚠️ Asset ID ${assetId} não encontrado. Tentando pelo Upload ID ${uploadId}...`);

                    const result = await supabase
                        .from('lessons')
                        .update({
                            mux_asset_id: assetId, // Atualiza para o ID Real do Asset
                            mux_status: 'ready',
                            mux_playback_id: playbackId,
                            duration_seconds: Math.floor(duration || 0)
                        })
                        .eq('mux_asset_id', uploadId); // Busca onde o ID salvo é o Upload ID

                    if (result.error) console.error('Erro ao atualizar por Upload ID:', result.error);
                    else console.log(`✅ Aula corrigida e atualizada via Upload ID: ${uploadId} -> ${assetId}`);
                } else {
                    console.log('✅ Asset pronto e atualizado:', assetId);
                }
                break;

            case 'video.asset.errored':
                await supabase
                    .from('lessons')
                    .update({ mux_status: 'errored' })
                    .eq('mux_asset_id', data.id);

                console.error('❌ Erro no asset:', data.id);
                break;

            case 'video.live_stream.active':
                await supabase
                    .from('live_sessions')
                    .update({ status: 'active' })
                    .eq('mux_live_stream_id', data.id);

                console.log('🔴 Live ativa:', data.id);
                break;

            case 'video.live_stream.idle':
                await supabase
                    .from('live_sessions')
                    .update({ status: 'idle' })
                    .eq('mux_live_stream_id', data.id);

                console.log('⚪ Live idle:', data.id);
                break;

            default:
                console.log('ℹ️ Evento Mux não tratado:', type);
        }

        res.json({ received: true });
    } catch (error) {
        console.error('❌ Erro no webhook Mux:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
}
