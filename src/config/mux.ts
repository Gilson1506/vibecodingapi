import Mux from '@mux/mux-node';

const muxTokenId = process.env.MUX_TOKEN_ID;
const muxTokenSecret = process.env.MUX_TOKEN_SECRET;

let mux: Mux | null = null;

if (muxTokenId && muxTokenSecret &&
    muxTokenId !== 'your_mux_token_id_here' &&
    muxTokenSecret !== 'your_mux_token_secret_here') {
    // Initialize Mux client
    mux = new Mux({
        tokenId: muxTokenId,
        tokenSecret: muxTokenSecret
    });
    console.log('✅ Mux client initialized');
} else {
    console.log('⚠️ Mux credentials not configured - video features disabled');
}

export { mux };
