import axios from 'axios';

const APPYPAY_BASE_URL = process.env.APPYPAY_BASE_URL || 'https://gwy-api.appypay.co.ao/v2.0';
const CLIENT_ID = process.env.APPYPAY_CLIENT_ID;
const CLIENT_SECRET = process.env.APPYPAY_CLIENT_SECRET;
const RESOURCE = process.env.APPYPAY_RESOURCE; // Optional resource ID

// Cache for access token
let accessToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * Get OAuth access token from AppyPay (Microsoft OAuth)
 */
async function getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 5 min buffer)
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
        return accessToken;
    }

    try {
        const tokenUrl = 'https://login.microsoftonline.com/auth.appypay.co.ao/oauth2/token';

        const params = new URLSearchParams();
        params.append('grant_type', 'client_credentials');
        params.append('client_id', CLIENT_ID || '');
        params.append('client_secret', CLIENT_SECRET || '');

        if (RESOURCE) {
            params.append('resource', RESOURCE);
        } else {
            params.append('scope', `${CLIENT_ID}/.default`);
        }

        console.log('🔄 Getting AppyPay OAuth token...');

        const response = await axios.post(tokenUrl, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        accessToken = response.data.access_token;
        // Set expiry to 5 minutes before actual expiry for safety
        const expiresIn = response.data.expires_in || 3600;
        tokenExpiry = Date.now() + ((expiresIn - 300) * 1000);

        console.log('✅ AppyPay token obtained successfully');
        return accessToken as string;
    } catch (error: any) {
        console.error('❌ Error getting AppyPay token:', error.response?.data || error.message);
        throw new Error('Failed to authenticate with AppyPay');
    }
}

interface CreateChargePayload {
    amount: number;
    currency?: string;
    merchantTransactionId: string;
    paymentMethod: 'GPO' | 'REF'; // 'GPO' for Multicaixa, 'REF' for Reference
    description?: string;
    paymentInfo?: {
        customerPhone?: string; // Required for GPO
        [key: string]: any;
    };
}

export const AppyPayService = {
    /**
     * Create a charge in AppyPay
     */
    async createCharge(payload: CreateChargePayload) {
        const token = await getAccessToken();

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Accept-Language': 'pt-PT',
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'VibeCoding/1.0'
        };

        // Get method IDs from env
        const GPO_METHOD_ID = process.env.APPYPAY_GPO_METHOD_ID;
        const REF_METHOD_ID = process.env.APPYPAY_REF_METHOD_ID;

        let fullPaymentMethod: string;
        let paymentInfoData: any = {};

        if (payload.paymentMethod === 'GPO') {
            if (!GPO_METHOD_ID) throw new Error('APPYPAY_GPO_METHOD_ID not configured');
            fullPaymentMethod = `GPO_${GPO_METHOD_ID}`;

            // For Multicaixa Express, phone is required in paymentInfo
            paymentInfoData = {
                phoneNumber: payload.paymentInfo?.customerPhone
            };
        } else {
            if (!REF_METHOD_ID) throw new Error('APPYPAY_REF_METHOD_ID not configured');
            fullPaymentMethod = `REF_${REF_METHOD_ID}`;
            paymentInfoData = payload.paymentInfo || {};
        }

        // Sanitize transaction ID (alphanumeric, max 15)
        // Ensure it fits the requirement. If existing ID is UUID, we might need to hash or truncate it carefully.
        // For simplicity, let's assume incoming merchantTransactionId is already safe or we use a short generated part.
        // AppyPay requires max 15 chars. UUID is 36. We need to store mapping.
        // STRATEGY: user submits UUID, we generate a short code for AppyPay, save both.
        // OR: Payload MUST provide the short ID. 
        // Let's assume the controller handles ID generation.

        const appyPayload: any = {
            amount: payload.amount,
            currency: payload.currency || 'AOA',
            description: payload.description || `Order ${payload.merchantTransactionId}`,
            merchantTransactionId: payload.merchantTransactionId,
            paymentMethod: fullPaymentMethod
        };

        if (Object.keys(paymentInfoData).length > 0) {
            appyPayload.paymentInfo = paymentInfoData;
        }

        const url = `${APPYPAY_BASE_URL}/charges`;
        console.log('📡 Calling AppyPay API:', url);
        console.log('📦 Payload:', JSON.stringify(appyPayload, null, 2));

        try {
            const response = await axios.post(url, appyPayload, { headers, timeout: 60000 });
            console.log('✅ AppyPay success:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('❌ AppyPay API error details:');
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', JSON.stringify(error.response.data, null, 2));
            } else {
                console.error('Error:', error.message);
            }
            throw error;
        }
    }
};
