import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { AppyPayService } from '../services/appyPay.service';
import { createUserAfterPayment, getUserByEmail } from '../services/user.service';
import { sendWelcomeEmail, sendPaymentPendingEmail } from '../services/email.service';

import { paymentEvents } from '../services/paymentEvents.service';

// Helper to handle successful payment logic (create user, send email)
async function handleSuccessfulPayment(payment: any) {
    try {
        let userId = payment.user_id;
        let userCreated = false;
        let password = '';

        // 1. If no user linked, create one
        if (!userId) {
            // Check if user already exists
            const existingUser = await getUserByEmail(payment.customer_email);

            if (existingUser) {
                console.log(`User ${payment.customer_email} already exists. Linking to payment ${payment.id}...`);
                userId = existingUser.id;

                // Link user to payment
                await supabase
                    .from('payments')
                    .update({ user_id: userId })
                    .eq('id', payment.id);

                // Grant access to existing user
                await supabase.from('users').update({ has_access: true }).eq('id', userId);

            } else {
                console.log(`Payment ${payment.id} has no user. Creating new user for ${payment.customer_email}...`);
                const result = await createUserAfterPayment(
                    payment.customer_email,
                    payment.customer_name,
                    payment.customer_phone
                );

                if (result) {
                    userId = result.user.id;
                    password = result.password;
                    userCreated = true;

                    // Link user to payment
                    await supabase
                        .from('payments')
                        .update({ user_id: userId })
                        .eq('id', payment.id);
                } else {
                    console.error('Failed to create user for payment', payment.id);
                }
            }
        } else {
            // User exists, ensure they have access (if logic requires)
            // Assuming createUserAfterPayment handles "has_access" for new users.
            // For existing, we might want to update role or access.
            await supabase.from('users').update({ has_access: true }).eq('id', userId);
        }

        // 2. Handle Project Purchase (if applicable)
        const metadata = payment.metadata || {};
        const projectId = metadata.projectId || metadata.project_id;
        if (metadata.type === 'project' && projectId && userId) {
            console.log(`Granting access to project ${projectId} for user ${userId}...`);
            await supabase
                .from('project_purchases')
                .upsert({
                    user_id: userId,
                    project_id: projectId,
                    payment_id: payment.id
                }, { onConflict: 'user_id, project_id' });
        }

        // 3. Handle Course Purchase (Enrollment)
        const courseId = metadata.courseId || metadata.course_id;
        if (metadata.type === 'course' && courseId && userId) {
            console.log(`Enrolling user ${userId} in course ${courseId}...`);
            await supabase
                .from('enrollments')
                .upsert({
                    user_id: userId,
                    course_id: courseId,
                    payment_id: payment.id
                }, { onConflict: 'user_id, course_id' });
        }

        // 3. Send Email
        // If we created a user, send Welcome email with credentials
        // If user already existed, maybe send a "Payment Received" email?
        // For now, let's focus on the "New User" flow as requested.
        if (userCreated) {
            await sendWelcomeEmail({
                to: payment.customer_email,
                name: payment.customer_name,
                email: payment.customer_email,
                password: password,
                dashboardUrl: process.env.DASHBOARD_URL || 'https://vibecoding.com/dashboard'
            });
        }

        return true;
    } catch (error) {
        console.error('Error in handleSuccessfulPayment:', error);
        return false;
    }
}

// Async helper for Multicaixa Express payments (runs in background)
async function processMulticaixaPaymentAsync(
    payment: any,
    merchantTransactionId: string,
    amount: number,
    multicaixaPhone: string,
    courseId?: string
) {
    try {
        console.log(`📱 Processing Multicaixa payment async for ${payment.id}...`);

        const appyResponse = await AppyPayService.createCharge({
            amount: amount,
            merchantTransactionId: merchantTransactionId,
            paymentMethod: 'GPO',
            paymentInfo: { customerPhone: multicaixaPhone },
            description: `Vibe Coding - Curso ${courseId || ''}`
        });

        console.log('✅ Multicaixa request sent to AppyPay:', appyResponse?.responseStatus?.status);

        // Update payment metadata with AppyPay response
        await supabase
            .from('payments')
            .update({
                metadata: {
                    ...payment.metadata,
                    appyResponse: appyResponse
                }
            })
            .eq('id', payment.id);

        // Note: Actual success/failure will come via webhook

    } catch (error: any) {
        console.error('❌ Multicaixa async processing error:', error.message);

        // Update payment as failed
        await supabase
            .from('payments')
            .update({
                status: 'failed',
                metadata: {
                    ...payment.metadata,
                    error: error.message
                }
            })
            .eq('id', payment.id);
    }
}

export const PaymentController = {
    /**
     * Create a new payment
     */
    async createPayment(req: Request, res: Response) {
        try {
            const {
                userId,
                courseId,
                amount,
                customerName,
                customerEmail,
                customerPhone,
                paymentMethod,
                multicaixaPhone
            } = req.body;

            if (!amount || !customerName || !customerEmail || !paymentMethod) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            const now = new Date();
            const timestamp = now.toISOString().replace(/[-:T.Z]/g, '').substring(2, 14);
            const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
            const merchantTransactionId = `T${timestamp}${random}`;

            // 1. Create local payment record
            const { data: payment, error: dbError } = await supabase
                .from('payments')
                .insert({
                    user_id: userId || null,
                    customer_name: customerName,
                    customer_email: customerEmail,
                    customer_phone: customerPhone,
                    amount_cents: Math.round(amount * 100),
                    currency: 'AOA',
                    status: 'pending',
                    payment_method: paymentMethod,
                    external_id: merchantTransactionId,
                    metadata: {
                        courseId,
                        projectId: req.body.projectId, // Support project specific ID
                        type: req.body.type || (courseId ? 'course' : 'project'), // Support explicit type
                        provider: 'appypay'
                    }
                })
                .select()
                .single();

            if (dbError) {
                console.error('Database error creating payment:', dbError);
                return res.status(500).json({ error: 'Failed to create payment record' });
            }

            // 2. Determine payment method
            const appyMethod = paymentMethod === 'multicaixa' ? 'GPO' : 'REF';

            // For Multicaixa Express (GPO): Return IMMEDIATELY and process async
            // The countdown modal will show while payment processes via webhook
            if (appyMethod === 'GPO') {
                // Return immediately so frontend shows countdown
                res.json({
                    paymentId: payment.id,
                    merchantTransactionId: merchantTransactionId,
                    status: 'processing',
                    message: 'Aguardando confirmação no telemóvel'
                });

                // Process AppyPay call asynchronously (don't await)
                processMulticaixaPaymentAsync(payment, merchantTransactionId, amount, multicaixaPhone, courseId);
                return;
            }

            // For Reference (REF): Wait for response to get reference number
            try {
                const appyResponse = await AppyPayService.createCharge({
                    amount: amount,
                    merchantTransactionId: merchantTransactionId,
                    paymentMethod: appyMethod,
                    description: `Vibe Coding - Curso ${courseId || ''}`
                });

                // Update local record with reference data
                const reference = appyResponse?.responseStatus?.reference;

                await supabase
                    .from('payments')
                    .update({
                        reference_code: reference?.referenceNumber || reference?.reference,
                        metadata: {
                            ...payment.metadata,
                            entity: reference?.entity,
                            appyResponse: appyResponse
                        }
                    })
                    .eq('id', payment.id);

                return res.json({
                    paymentId: payment.id,
                    merchantTransactionId: merchantTransactionId,
                    appyResponse: appyResponse
                });

            } catch (apiError: any) {
                await supabase
                    .from('payments')
                    .update({ status: 'failed', metadata: { error: apiError.message } })
                    .eq('id', payment.id);

                return res.status(502).json({ error: 'Payment provider error', details: apiError.message });
            }

        } catch (error: any) {
            console.error('Create payment error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    /**
     * Get Payment Status
     */
    async getPaymentStatus(req: Request, res: Response) {
        try {
            const { id } = req.params;

            const { data: payment, error } = await supabase
                .from('payments')
                .select('*')
                .or(`id.eq.${id},external_id.eq.${id}`)
                .single();

            if (error || !payment) {
                return res.status(404).json({ error: 'Payment not found' });
            }

            res.json(payment);
        } catch (error) {
            res.status(500).json({ error: 'Internal error' });
        }
    },

    /**
     * SSE endpoint for real-time payment status updates
     */
    async subscribeToPaymentStatus(req: Request, res: Response) {
        const { id } = req.params;

        console.log(`📡 SSE: Client subscribing to payment ${id}`);

        // Set SSE headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.flushHeaders();

        // Send initial connection event
        res.write(`data: ${JSON.stringify({ type: 'connected', paymentId: id })}\n\n`);

        // Check current status immediately
        const { data: currentPayment } = await supabase
            .from('payments')
            .select('*')
            .or(`id.eq.${id},external_id.eq.${id}`)
            .single();

        if (currentPayment) {
            res.write(`data: ${JSON.stringify({ type: 'status', status: currentPayment.status, payment: currentPayment })}\n\n`);

            // If already completed/failed, send final status and close
            if (currentPayment.status === 'completed' || currentPayment.status === 'failed') {
                res.write(`data: ${JSON.stringify({ type: 'final', status: currentPayment.status, payment: currentPayment })}\n\n`);
                res.end();
                return;
            }
        }

        // Listen for updates
        const onUpdate = (data: { status: string; payment: any }) => {
            console.log(`📤 SSE: Sending update for ${id}: ${data.status}`);
            res.write(`data: ${JSON.stringify({ type: 'status', status: data.status, payment: data.payment })}\n\n`);

            // If final status, close connection
            if (data.status === 'completed' || data.status === 'failed') {
                res.write(`data: ${JSON.stringify({ type: 'final', status: data.status, payment: data.payment })}\n\n`);
                res.end();
            }
        };

        paymentEvents.onPaymentUpdate(id, onUpdate);

        // Cleanup on disconnect
        req.on('close', () => {
            console.log(`🔌 SSE: Client disconnected from payment ${id}`);
            paymentEvents.offPaymentUpdate(id, onUpdate);
        });

        // Keep connection alive with heartbeat
        const heartbeat = setInterval(() => {
            res.write(': heartbeat\n\n');
        }, 30000);

        req.on('close', () => {
            clearInterval(heartbeat);
        });
    },

    /**
     * Webhook Handler
     */
    async handleWebhook(req: Request, res: Response) {
        try {
            const body = req.body;
            console.log('🔔 AppyPay Webhook:', JSON.stringify(body, null, 2));

            const merchantTransactionId = body.merchantTransactionId;
            // Status conventions vary. Check docs or logs. 
            // Usually: success/successful for success.
            const status = body.responseStatus?.status;
            const isSuccessful = body.responseStatus?.successful;

            if (!merchantTransactionId) {
                return res.status(400).send('Missing merchantTransactionId');
            }

            // Find payment
            const { data: payment, error: findError } = await supabase
                .from('payments')
                .select('*')
                .eq('external_id', merchantTransactionId)
                .single();

            if (findError || !payment) {
                console.warn(`Payment not found for ${merchantTransactionId}`);
                return res.status(404).send('Payment not found');
            }

            // Determine status
            let newStatus = payment.status;

            // Map AppyPay status to our status
            // CRITICAL: "Pending" has successful=true but status="Pending", so we must check status FIRST
            const statusLower = (status || '').toLowerCase();

            if (statusLower === 'pending') {
                // Keep as pending - DO NOT process as completed!
                newStatus = 'pending';
                console.log(`Payment ${payment.id} status: Pending (waiting for confirmation)`);

                // If this is a Reference payment, send email with reference details
                const reference = body.reference;
                if (reference && reference.referenceNumber && payment.payment_method === 'referencia') {
                    console.log(`Sending pending email with reference data for payment ${payment.id}`);
                    await sendPaymentPendingEmail(
                        payment.customer_email,
                        payment.customer_name,
                        reference.referenceNumber,
                        reference.entity || '11424',
                        payment.amount_cents / 100
                    );

                    // Update payment with reference data
                    await supabase
                        .from('payments')
                        .update({
                            reference_code: reference.referenceNumber,
                            metadata: {
                                ...payment.metadata,
                                entity: reference.entity,
                                dueDate: reference.dueDate
                            }
                        })
                        .eq('id', payment.id);
                }
            } else if (statusLower === 'success' || statusLower === 'completed' || statusLower === 'paid') {
                newStatus = 'completed';
            } else if (statusLower === 'failed' || statusLower === 'expired' || statusLower === 'cancelled') {
                newStatus = 'failed';
            }

            // If status changed to completed, trigger actions
            if (newStatus === 'completed' && payment.status !== 'completed') {
                console.log(`Payment ${payment.id} completed. Processing actions...`);
                await handleSuccessfulPayment(payment);

                // Update paid_at
                const { data: updatedPayment } = await supabase
                    .from('payments')
                    .update({ status: newStatus, paid_at: new Date().toISOString() })
                    .eq('id', payment.id)
                    .select()
                    .single();

                // Emit SSE event for real-time update
                paymentEvents.emitPaymentUpdate(payment.id, newStatus, updatedPayment || { ...payment, status: newStatus });
                paymentEvents.emitPaymentUpdate(payment.external_id, newStatus, updatedPayment || { ...payment, status: newStatus });

            } else if (newStatus !== payment.status) {
                const { data: updatedPayment } = await supabase
                    .from('payments')
                    .update({ status: newStatus })
                    .eq('id', payment.id)
                    .select()
                    .single();

                // Emit SSE event for real-time update
                paymentEvents.emitPaymentUpdate(payment.id, newStatus, updatedPayment || { ...payment, status: newStatus });
                paymentEvents.emitPaymentUpdate(payment.external_id, newStatus, updatedPayment || { ...payment, status: newStatus });
            }

            res.status(200).send('OK');

        } catch (error) {
            console.error('Webhook error:', error);
            res.status(500).send('Internal Error');
        }
    }
};
