import { EventEmitter } from 'events';

// Global event emitter for payment status updates
class PaymentEventsManager extends EventEmitter {
    private static instance: PaymentEventsManager;

    private constructor() {
        super();
        // Increase max listeners for multiple concurrent SSE connections
        this.setMaxListeners(100);
    }

    public static getInstance(): PaymentEventsManager {
        if (!PaymentEventsManager.instance) {
            PaymentEventsManager.instance = new PaymentEventsManager();
        }
        return PaymentEventsManager.instance;
    }

    // Emit a payment status update
    emitPaymentUpdate(paymentId: string, status: string, payment: any) {
        console.log(`📤 Emitting payment update for ${paymentId}: ${status}`);
        this.emit(`payment:${paymentId}`, { status, payment });
        this.emit('payment:any', { paymentId, status, payment });
    }

    // Subscribe to a specific payment's updates
    onPaymentUpdate(paymentId: string, callback: (data: { status: string; payment: any }) => void) {
        this.on(`payment:${paymentId}`, callback);
    }

    // Unsubscribe from a payment's updates
    offPaymentUpdate(paymentId: string, callback: (data: { status: string; payment: any }) => void) {
        this.off(`payment:${paymentId}`, callback);
    }
}

export const paymentEvents = PaymentEventsManager.getInstance();
