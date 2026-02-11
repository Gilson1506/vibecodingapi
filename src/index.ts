// Load environment variables FIRST - this import loads .env immediately
import 'dotenv/config';

import express from 'express';
import cors from 'cors';

// Import routes
import paymentRoutes from './routes/payment.routes';
import videoRoutes from './routes/video.routes';
import webhookRoutes from './routes/webhook.routes';
import emailRoutes from './routes/email.routes';
import smsRoutes from './routes/sms.routes';
import liveRoutes from './routes/live.routes';
import progressRoutes from './routes/progress.routes';
import userRoutes from './routes/user.routes';
import muxRoutes from './routes/mux.routes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Vibe Coding API is running' });
});

// Routes
app.get('/', (req, res) => {
    res.json({
        name: 'Vibe Coding API',
        version: '1.0.0',
        endpoints: {
            health: '/health',
            payments: '/api/payments',
            video: '/api/video',
            email: '/api/email',
            webhooks: '/api/webhooks',
            sms: '/api/sms',
            live: '/api/live',
            progress: '/api/progress'
        }
    });
});

// API Routes
app.use('/api/payments', paymentRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/user', userRoutes);
app.use('/api/mux', muxRoutes);
app.use('/api/progress', progressRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('❌ Error:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 API running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`\n📡 Endpoints disponíveis:`);
    console.log(`   POST /api/payments/express`);
    console.log(`   POST /api/payments/reference`);
    console.log(`   POST /api/video/upload-url`);
    console.log(`   POST /api/video/create-live`);
    console.log(`   POST /api/email/send`);
    console.log(`   POST /api/email/send-bulk`);
    console.log(`   POST /api/webhooks/appypay`);
    console.log(`   POST /api/webhooks/mux`);
});

export default app;

