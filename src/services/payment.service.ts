import { supabase } from '../config/supabase';
import type { Payment, PaymentData } from '../types';


/**
 * Cria um novo pagamento no banco de dados
 */
export async function createPayment(paymentData: PaymentData): Promise<Payment | null> {
    try {
        const { data, error } = await supabase
            .from('payments')
            .insert({
                customer_name: paymentData.customerName,
                customer_email: paymentData.customerEmail,
                customer_phone: paymentData.customerPhone,
                amount_cents: paymentData.amountCents,
                payment_method: paymentData.paymentMethod,
                status: 'pending',
                currency: 'AOA'
            })
            .select()
            .single();

        if (error) {
            console.error('❌ Erro ao criar pagamento:', error);
            return null;
        }

        return data as Payment;
    } catch (error) {
        console.error('❌ Erro inesperado ao criar pagamento:', error);
        return null;
    }
}

/**
 * Atualiza o status de um pagamento
 */
export async function updatePaymentStatus(
    paymentId: string,
    status: 'confirmed' | 'failed' | 'expired',
    externalId?: string,
    userId?: string
): Promise<boolean> {
    try {
        const updateData: any = {
            status,
            ...(externalId && { external_id: externalId }),
            ...(userId && { user_id: userId }),
            ...(status === 'confirmed' && { paid_at: new Date().toISOString() })
        };

        const { error } = await supabase
            .from('payments')
            .update(updateData)
            .eq('id', paymentId);

        if (error) {
            console.error('❌ Erro ao atualizar pagamento:', error);
            return false;
        }

        console.log(`✅ Pagamento ${paymentId} atualizado para ${status}`);
        return true;
    } catch (error) {
        console.error('❌ Erro inesperado ao atualizar pagamento:', error);
        return false;
    }
}

/**
 * Busca pagamento por ID externo (Appy Pay)
 */
export async function getPaymentByExternalId(externalId: string): Promise<Payment | null> {
    try {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('external_id', externalId)
            .single();

        if (error) {
            return null;
        }

        return data as Payment;
    } catch (error) {
        return null;
    }
}

/**
 * Busca pagamento por email do cliente
 */
export async function getPaymentByEmail(email: string): Promise<Payment | null> {
    try {
        const { data, error } = await supabase
            .from('payments')
            .select('*')
            .eq('customer_email', email)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) {
            return null;
        }

        return data as Payment;
    } catch (error) {
        return null;
    }
}
