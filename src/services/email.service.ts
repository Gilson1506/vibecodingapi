import { brevoClient } from '../config/brevo';
import * as brevo from '@getbrevo/brevo';
import type { EmailData } from '../types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Envia email de boas-vindas com credenciais de acesso
 */
export async function sendWelcomeEmail(emailData: EmailData): Promise<boolean> {
    try {
        // Carregar template HTML
        const templatePath = path.join(__dirname, '../templates/welcome.html');
        let htmlContent = fs.readFileSync(templatePath, 'utf-8');

        // Substituir variáveis no template
        htmlContent = htmlContent
            .replace(/{{name}}/g, emailData.name)
            .replace(/{{email}}/g, emailData.email)
            .replace(/{{password}}/g, emailData.password)
            .replace(/{{dashboard_url}}/g, emailData.dashboardUrl);

        // Criar email
        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.to = [{ email: emailData.to, name: emailData.name }];
        sendSmtpEmail.sender = {
            email: process.env.BREVO_SENDER_EMAIL || 'noreply@vibecoding.com',
            name: process.env.BREVO_SENDER_NAME || 'Vibe Coding'
        };
        sendSmtpEmail.subject = '🎉 Bem-vindo à Vibe Coding!';
        sendSmtpEmail.htmlContent = htmlContent;

        // Enviar
        if (brevoClient) {
            await (brevoClient as any).sendTransacEmail(sendSmtpEmail);
            console.log('✅ Email de boas-vindas enviado para:', emailData.to);
        } else {
            console.log('⚠️ Brevo client não inicializado - Email de boas-vindas não enviado');
        }

        return true;
    } catch (error) {
        console.error('❌ Erro ao enviar email:', error);
        return false;
    }
}

/**
 * Envia email de notificação de pagamento pendente com dados de referência
 */
export async function sendPaymentPendingEmail(
    email: string,
    name: string,
    referenceNumber: string,
    entity: string,
    amount: number
): Promise<boolean> {
    try {
        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.to = [{ email, name }];
        sendSmtpEmail.sender = {
            email: process.env.BREVO_SENDER_EMAIL || 'noreply@vibecoding.com',
            name: process.env.BREVO_SENDER_NAME || 'Vibe Coding'
        };
        sendSmtpEmail.subject = '📋 Dados para Pagamento - Vibe Coding';
        sendSmtpEmail.htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0ea5e9, #6366f1); padding: 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .reference-box { background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
        .reference-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
        .reference-item:last-child { border-bottom: none; }
        .label { color: #64748b; font-size: 14px; }
        .value { color: #1e293b; font-weight: bold; font-size: 18px; }
        .cta { background: #0ea5e9; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 20px; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
        .instructions { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 Vibe Coding</h1>
        </div>
        <div class="content">
            <h2>Olá ${name}! 👋</h2>
            <p>O seu pagamento está <strong>pendente</strong>. Conclua o pagamento para acessar a Vibe Coding e começar o seu curso!</p>
            
            <div class="reference-box">
                <div class="reference-item">
                    <span class="label">Entidade:</span>
                    <span class="value">${entity}</span>
                </div>
                <div class="reference-item">
                    <span class="label">Referência:</span>
                    <span class="value">${referenceNumber}</span>
                </div>
                <div class="reference-item">
                    <span class="label">Valor:</span>
                    <span class="value">${amount.toLocaleString('pt-AO')} Kz</span>
                </div>
            </div>
            
            <div class="instructions">
                <strong>📱 Como pagar:</strong>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Use qualquer <strong>ATM</strong> (caixa automática)</li>
                    <li>Use o app <strong>Multicaixa Express</strong> → Pagamentos por Referência</li>
                    <li>Use o seu <strong>Internet Banking</strong></li>
                </ul>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">
                Assim que confirmarmos o pagamento, você receberá automaticamente os seus dados de acesso por email.
            </p>
            
            <p style="margin-top: 30px;">Aguardamos por você! 🚀</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Vibe Coding. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
        `;

        if (brevoClient) {
            await (brevoClient as any).sendTransacEmail(sendSmtpEmail);
            console.log('✅ Email de pagamento pendente enviado para:', email);
        } else {
            console.log('⚠️ Brevo client não inicializado - Email de pagamento pendente não enviado');
        }

        return true;
    } catch (error) {
        console.error('❌ Erro ao enviar email de pagamento pendente:', error);
        return false;
    }
}
