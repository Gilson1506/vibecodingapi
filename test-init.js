require('dotenv').config();

console.log('=== Testing Client Initialization ===\n');

// Test Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase URL check:', supabaseUrl !== 'https://your-project.supabase.co');
console.log('Supabase Key exists:', !!supabaseServiceKey);
console.log('Supabase Key check:', supabaseServiceKey !== 'your_service_key_here');
console.log('Supabase should init:', !!(supabaseUrl && supabaseServiceKey && supabaseUrl !== 'https://your-project.supabase.co' && supabaseServiceKey !== 'your_service_key_here'));
console.log('');

// Test Brevo
const brevoApiKey = process.env.BREVO_API_KEY;
console.log('Brevo API Key exists:', !!brevoApiKey);
console.log('Brevo API Key length:', brevoApiKey?.length);
console.log('Brevo API Key check:', brevoApiKey !== 'your_brevo_api_key_here');
console.log('Brevo should init:', !!(brevoApiKey && brevoApiKey !== 'your_brevo_api_key_here'));
console.log('');

// Test Mux
const muxTokenId = process.env.MUX_TOKEN_ID;
const muxTokenSecret = process.env.MUX_TOKEN_SECRET;
console.log('Mux Token ID:', muxTokenId);
console.log('Mux Token ID check:', muxTokenId !== 'your_mux_token_id_here');
console.log('Mux Token Secret exists:', !!muxTokenSecret);
console.log('Mux Token Secret check:', muxTokenSecret !== 'your_mux_token_secret_here');
console.log('Mux should init:', !!(muxTokenId && muxTokenSecret && muxTokenId !== 'your_mux_token_id_here' && muxTokenSecret !== 'your_mux_token_secret_here'));
