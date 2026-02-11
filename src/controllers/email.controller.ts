import { Request, Response } from 'express';
import { brevoClient } from '../config/brevo';
import * as brevo from '@getbrevo/brevo';

/**
 * Envia email manual via Brevo
 */
export async function sendManualEmail(req: Request, res: Response) {
    try {
        const { to, subject, htmlContent, senderName, senderEmail } = req.body;

        // Validação
        if (!to || !subject || !htmlContent) {
            return res.status(400).json({
                error: 'Campos obrigatórios: to, subject, htmlContent'
            });
        }

        if (!brevoClient) {
            return res.status(503).json({
                error: 'Serviço de email não configurado'
            });
        }

        // Criar email
        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.to = Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }];
        sendSmtpEmail.sender = {
            email: senderEmail || process.env.BREVO_SENDER_EMAIL || 'noreply@vibecoding.com',
            name: senderName || process.env.BREVO_SENDER_NAME || 'Vibe Coding'
        };
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = htmlContent;

        // Enviar
        const result = await brevoClient.sendTransacEmail(sendSmtpEmail);

        console.log('✅ Email enviado:', to);

        res.json({
            success: true,
            messageId: (result as any).messageId || result.body?.messageId,
            message: 'Email enviado com sucesso'
        });
    } catch (error: any) {
        console.error('❌ Erro ao enviar email:', error);
        res.status(500).json({
            error: 'Erro ao enviar email',
            details: error.message
        });
    }
}

/**
 * Envia email em massa
 */
export async function sendBulkEmail(req: Request, res: Response) {
    try {
        const { recipients, subject, htmlContent, senderName, senderEmail } = req.body;

        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({
                error: 'recipients deve ser um array com pelo menos um email'
            });
        }

        if (!subject || !htmlContent) {
            return res.status(400).json({
                error: 'Campos obrigatórios: subject, htmlContent'
            });
        }

        if (!brevoClient) {
            return res.status(503).json({
                error: 'Serviço de email não configurado'
            });
        }

        const results = [];
        const errors = [];

        for (const recipient of recipients) {
            try {
                const sendSmtpEmail = new brevo.SendSmtpEmail();
                sendSmtpEmail.to = [{ email: recipient }];
                sendSmtpEmail.sender = {
                    email: senderEmail || process.env.BREVO_SENDER_EMAIL || 'noreply@vibecoding.com',
                    name: senderName || process.env.BREVO_SENDER_NAME || 'Vibe Coding'
                };
                sendSmtpEmail.subject = subject;
                sendSmtpEmail.htmlContent = htmlContent;

                await brevoClient.sendTransacEmail(sendSmtpEmail);
                results.push({ email: recipient, status: 'sent' });
            } catch (error: any) {
                errors.push({ email: recipient, error: error.message });
            }
        }

        res.json({
            success: true,
            sent: results.length,
            failed: errors.length,
            results,
            errors
        });
    } catch (error: any) {
        console.error('❌ Erro ao enviar emails em massa:', error);
        res.status(500).json({
            error: 'Erro ao enviar emails',
            details: error.message
        });
    }
}
