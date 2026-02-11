import * as brevo from '@getbrevo/brevo';

const brevoApiKey = process.env.BREVO_API_KEY;

let brevoClient: brevo.TransactionalEmailsApi | null = null;

if (brevoApiKey && brevoApiKey !== 'your_brevo_api_key_here') {
    // Initialize Brevo API client
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey);
    brevoClient = apiInstance;
    console.log('✅ Brevo client initialized');
} else {
    console.log('⚠️ Brevo API key not configured - email features disabled');
}

export { brevoClient };

