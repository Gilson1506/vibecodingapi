require('dotenv').config();

console.log('=== Environment Variables Debug ===\n');

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_URL length:', process.env.SUPABASE_URL?.length);
console.log('SUPABASE_URL trimmed:', process.env.SUPABASE_URL?.trim());
console.log('');

console.log('BREVO_API_KEY:', process.env.BREVO_API_KEY ? 'SET (length: ' + process.env.BREVO_API_KEY.length + ')' : 'NOT SET');
console.log('');

console.log('MUX_TOKEN_ID:', process.env.MUX_TOKEN_ID);
console.log('MUX_TOKEN_ID length:', process.env.MUX_TOKEN_ID?.length);
console.log('');

console.log('MUX_PRIVATE_KEY:', process.env.MUX_PRIVATE_KEY ? 'SET (length: ' + process.env.MUX_PRIVATE_KEY.length + ')' : 'NOT SET');
