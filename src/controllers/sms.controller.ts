import { Request, Response } from 'express';
import axios from 'axios';

// Brevo API URL for Transactional SMS
// Docs: https://api.brevo.com/v3/transactionalSMS/send
const BREVO_SMS_URL = 'https://api.brevo.com/v3/transactionalSMS/send';

interface SmsPayload {
    recipient: string;
    content: string;
    sender: string;
    tag?: string;
    type?: 'marketing' | 'transactional';
    webUrl?: string;
}

export const sendSms = async (req: Request, res: Response) => {
    try {
        const { recipient, content, sender, tag, type, webUrl } = req.body;

        if (!recipient || !content || !sender) {
            return res.status(400).json({ error: 'Missing required fields: recipient, content, sender' });
        }

        const payload: any = {
            recipient,
            content,
            sender,
            type: type || 'transactional', // Default to transactional
            unicodeEnabled: true // Support emojis/special chars
        };

        if (tag) payload.tag = tag;
        if (webUrl) payload.webUrl = webUrl;

        // Brevo requires 'marketing' type if content has [STOP CODE]
        // Docs say: "If your SMS content includes [STOP CODE], select the type as marketing"
        if (content.includes('[STOP CODE]') || content.includes('[STOP]')) {
            payload.type = 'marketing';
        }

        const response = await axios.post(BREVO_SMS_URL, payload, {
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY,
                'content-type': 'application/json'
            }
        });

        return res.status(200).json({
            success: true,
            data: response.data,
            messageId: response.data.messageId
        });

    } catch (error: any) {
        console.error('Error sending SMS via Brevo:', error.response?.data || error.message);
        return res.status(500).json({
            error: 'Failed to send SMS',
            details: error.response?.data || error.message
        });
    }
};

export const sendBulkSms = async (req: Request, res: Response) => {
    try {
        const { recipients, content, sender, tag } = req.body;

        if (!recipients || !Array.isArray(recipients) || !content || !sender) {
            return res.status(400).json({ error: 'Invalid payload. recipients must be an array.' });
        }

        // Brevo Transactional SMS API doesn't support bulk in one call natively like Email.
        // We have to loop or use a different endpoint (Marketing SMS).
        // For 'transactionalSMS', we loop here for simplicity as per docs provided (which focused on single send).
        // WARNING: This is slow for large lists. For production large scale, use a queue.

        const results = [];
        const errors = [];

        for (const recipient of recipients) {
            try {
                const payload = {
                    recipient,
                    content,
                    sender,
                    type: 'transactional',
                    tag: tag || undefined,
                    unicodeEnabled: true
                };

                const response = await axios.post(BREVO_SMS_URL, payload, {
                    headers: {
                        'accept': 'application/json',
                        'api-key': process.env.BREVO_API_KEY,
                        'content-type': 'application/json'
                    }
                });

                results.push({ recipient, success: true, messageId: response.data.messageId });
            } catch (err: any) {
                console.error(`Failed to send to ${recipient}:`, err.response?.data || err.message);
                errors.push({ recipient, success: false, error: err.response?.data || err.message });
            }
        }

        return res.status(200).json({
            message: 'Bulk processing completed',
            sent: results.length,
            failed: errors.length,
            details: { results, errors }
        });

    } catch (error: any) {
        console.error('Error in bulk SMS:', error);
        return res.status(500).json({ error: 'Internal server error processing bulk SMS' });
    }
};

export const getSmsEvents = async (req: Request, res: Response) => {
    try {
        const { limit = 20, offset = 0 } = req.query;

        // Calculate default startDate (7 days ago) if not provided
        // Brevo requires startDate if endDate is used, or just startDate etc. 
        // Docs: "Mandatory if endDate is used."
        // Let's use 'days' parameter if possible, or calculate dates.
        // Docs say: "days: Number of days in the past including today (positive integer). Not compatible with startDate and endDate."

        // We'll default to listing the last 30 days
        const days = 30;

        const url = `https://api.brevo.com/v3/transactionalSMS/statistics/events?limit=${limit}&offset=${offset}&days=${days}&sort=desc`;

        const response = await axios.get(url, {
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY
            }
        });

        // Response format: { events: [ ... ] }
        return res.status(200).json(response.data);

    } catch (error: any) {
        console.error('Error fetching SMS events:', error.response?.data || error.message);
        // If 402 or 400, it might be related to account status
        return res.status(500).json({
            error: 'Failed to fetch SMS history',
            details: error.response?.data || error.message
        });
    }
};
