export interface PaymentData {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    amountCents: number;
    paymentMethod: 'express' | 'reference';
}

export interface User {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
    hasAccess: boolean;
    role: 'student' | 'admin';
}

export interface Payment {
    id: string;
    userId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    amountCents: number;
    status: 'pending' | 'confirmed' | 'failed' | 'expired';
    paymentMethod: string;
    externalId?: string;
    referenceCode?: string;
    paidAt?: string;
    createdAt: string;
}

export interface MuxAsset {
    id: string;
    playbackId: string;
    status: string;
    duration?: number;
}

export interface EmailData {
    to: string;
    name: string;
    email: string;
    password: string;
    dashboardUrl: string;
}
