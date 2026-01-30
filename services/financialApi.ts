/**
 * Nexus WMS - Financial API Service
 * 
 * This service provides API endpoints for financial operations.
 * Currently uses localStorage, but structured for easy backend migration.
 */

import {
    Vendor,
    Client,
    FinancialTransaction,
    EntityType,
    TransactionType,
    PaymentTerms,
    CollectionAlert
} from '../types';

import {
    createVendorInvoice,
    createClientInvoice,
    checkCreditLimit,
    hasOverduePayments
} from '../utils/financialHelpers';

// ============================================
// VENDOR ENDPOINTS
// ============================================

export const VendorService = {
    /**
     * GET /api/vendors
     * Get all vendors
     */
    async getAll(): Promise<Vendor[]> {
        const data = localStorage.getItem('nexus_vendors');
        return data ? JSON.parse(data) : [];
    },

    /**
     * GET /api/vendors/:id
     * Get vendor by ID
     */
    async getById(id: string): Promise<Vendor | null> {
        const vendors = await this.getAll();
        return vendors.find(v => v.id === id) || null;
    },

    /**
     * POST /api/vendors
     * Create new vendor
     */
    async create(vendor: Omit<Vendor, 'id' | 'currentBalance'>): Promise<Vendor> {
        const vendors = await this.getAll();
        const newVendor: Vendor = {
            ...vendor,
            id: `VEN-${Date.now()}`,
            currentBalance: 0
        };
        vendors.push(newVendor);
        localStorage.setItem('nexus_vendors', JSON.stringify(vendors));
        return newVendor;
    },

    /**
     * PUT /api/vendors/:id
     * Update vendor
     */
    async update(id: string, updates: Partial<Vendor>): Promise<Vendor | null> {
        const vendors = await this.getAll();
        const index = vendors.findIndex(v => v.id === id);
        if (index === -1) return null;

        vendors[index] = { ...vendors[index], ...updates };
        localStorage.setItem('nexus_vendors', JSON.stringify(vendors));
        return vendors[index];
    },

    /**
     * DELETE /api/vendors/:id
     * Delete vendor (soft delete recommended in production)
     */
    async delete(id: string): Promise<boolean> {
        const vendors = await this.getAll();
        const filtered = vendors.filter(v => v.id !== id);
        if (filtered.length === vendors.length) return false;

        localStorage.setItem('nexus_vendors', JSON.stringify(filtered));
        return true;
    },

    /**
     * GET /api/vendors/:id/transactions
     * Get vendor transaction history (SOA)
     */
    async getTransactions(id: string, dateFrom?: string, dateTo?: string): Promise<FinancialTransaction[]> {
        const data = localStorage.getItem('nexus_financial_transactions');
        let transactions: FinancialTransaction[] = data ? JSON.parse(data) : [];

        transactions = transactions.filter(t =>
            t.entityType === EntityType.VENDOR && t.entityId === id
        );

        if (dateFrom) {
            transactions = transactions.filter(t => t.transactionDate >= dateFrom);
        }
        if (dateTo) {
            transactions = transactions.filter(t => t.transactionDate <= dateTo);
        }

        return transactions.sort((a, b) =>
            new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
        );
    },

    /**
     * POST /api/vendors/:id/payment
     * Record payment to vendor
     */
    async recordPayment(
        id: string,
        amount: number,
        reference: string,
        notes?: string
    ): Promise<FinancialTransaction> {
        const vendor = await this.getById(id);
        if (!vendor) throw new Error('Vendor not found');

        const newBalance = vendor.currentBalance - amount;

        const payment: FinancialTransaction = {
            id: `PAY-${Date.now()}`,
            entityType: EntityType.VENDOR,
            entityId: vendor.id,
            entityName: vendor.name,
            transactionDate: new Date().toISOString(),
            type: TransactionType.PAYMENT,
            amount,
            balanceAfter: newBalance,
            referenceDocId: reference,
            paidDate: new Date().toISOString().split('T')[0],
            notes
        };

        // Update vendor balance
        await this.update(id, { currentBalance: newBalance });

        // Save transaction
        const data = localStorage.getItem('nexus_financial_transactions');
        const transactions: FinancialTransaction[] = data ? JSON.parse(data) : [];
        transactions.push(payment);
        localStorage.setItem('nexus_financial_transactions', JSON.stringify(transactions));

        return payment;
    }
};

// ============================================
// CLIENT ENDPOINTS
// ============================================

export const ClientService = {
    /**
     * GET /api/clients
     * Get all clients
     */
    async getAll(): Promise<Client[]> {
        const data = localStorage.getItem('nexus_clients');
        return data ? JSON.parse(data) : [];
    },

    /**
     * GET /api/clients/:id
     * Get client by ID
     */
    async getById(id: string): Promise<Client | null> {
        const clients = await this.getAll();
        return clients.find(c => c.id === id) || null;
    },

    /**
     * POST /api/clients
     * Create new client
     */
    async create(client: Omit<Client, 'id' | 'currentBalance'>): Promise<Client> {
        const clients = await this.getAll();
        const newClient: Client = {
            ...client,
            id: `CLI-${Date.now()}`,
            currentBalance: 0
        };
        clients.push(newClient);
        localStorage.setItem('nexus_clients', JSON.stringify(clients));
        return newClient;
    },

    /**
     * PUT /api/clients/:id
     * Update client
     */
    async update(id: string, updates: Partial<Client>): Promise<Client | null> {
        const clients = await this.getAll();
        const index = clients.findIndex(c => c.id === id);
        if (index === -1) return null;

        clients[index] = { ...clients[index], ...updates };
        localStorage.setItem('nexus_clients', JSON.stringify(clients));
        return clients[index];
    },

    /**
     * DELETE /api/clients/:id
     * Delete client
     */
    async delete(id: string): Promise<boolean> {
        const clients = await this.getAll();
        const filtered = clients.filter(c => c.id !== id);
        if (filtered.length === clients.length) return false;

        localStorage.setItem('nexus_clients', JSON.stringify(filtered));
        return true;
    },

    /**
     * GET /api/clients/:id/transactions
     * Get client transaction history (SOA)
     */
    async getTransactions(id: string, dateFrom?: string, dateTo?: string): Promise<FinancialTransaction[]> {
        const data = localStorage.getItem('nexus_financial_transactions');
        let transactions: FinancialTransaction[] = data ? JSON.parse(data) : [];

        transactions = transactions.filter(t =>
            t.entityType === EntityType.CLIENT && t.entityId === id
        );

        if (dateFrom) {
            transactions = transactions.filter(t => t.transactionDate >= dateFrom);
        }
        if (dateTo) {
            transactions = transactions.filter(t => t.transactionDate <= dateTo);
        }

        return transactions.sort((a, b) =>
            new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
        );
    },

    /**
     * POST /api/clients/:id/payment
     * Record payment from client
     */
    async recordPayment(
        id: string,
        amount: number,
        invoiceId: string,
        notes?: string
    ): Promise<FinancialTransaction> {
        const client = await this.getById(id);
        if (!client) throw new Error('Client not found');

        const newBalance = client.currentBalance - amount;

        const payment: FinancialTransaction = {
            id: `RCV-${Date.now()}`,
            entityType: EntityType.CLIENT,
            entityId: client.id,
            entityName: client.name,
            transactionDate: new Date().toISOString(),
            type: TransactionType.PAYMENT,
            amount,
            balanceAfter: newBalance,
            referenceDocId: invoiceId,
            paidDate: new Date().toISOString().split('T')[0],
            notes
        };

        // Update client balance
        await this.update(id, { currentBalance: newBalance });

        // Save transaction
        const data = localStorage.getItem('nexus_financial_transactions');
        const transactions: FinancialTransaction[] = data ? JSON.parse(data) : [];
        transactions.push(payment);

        // Mark invoice as paid
        const invoiceIndex = transactions.findIndex(t => t.id === invoiceId);
        if (invoiceIndex !== -1) {
            transactions[invoiceIndex].paidDate = new Date().toISOString().split('T')[0];
        }

        localStorage.setItem('nexus_financial_transactions', JSON.stringify(transactions));

        return payment;
    },

    /**
     * GET /api/clients/overdue
     * Get clients with overdue payments
     */
    async getOverdue(): Promise<CollectionAlert[]> {
        const clients = await this.getAll();
        const data = localStorage.getItem('nexus_financial_transactions');
        const transactions: FinancialTransaction[] = data ? JSON.parse(data) : [];

        const today = new Date();
        const alerts: CollectionAlert[] = [];

        transactions
            .filter(t =>
                t.entityType === EntityType.CLIENT &&
                t.type === TransactionType.INVOICE &&
                t.dueDate &&
                !t.paidDate
            )
            .forEach(t => {
                const dueDate = new Date(t.dueDate!);
                const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

                if (daysOverdue > 0) {
                    const client = clients.find(c => c.id === t.entityId);
                    alerts.push({
                        id: t.id,
                        clientId: t.entityId,
                        clientName: t.entityName,
                        invoiceId: t.referenceDocId,
                        invoiceDate: t.transactionDate,
                        dueDate: t.dueDate!,
                        amount: t.amount,
                        daysOverdue,
                        currentBalance: client?.currentBalance || 0
                    });
                }
            });

        return alerts.sort((a, b) => b.daysOverdue - a.daysOverdue);
    },

    /**
     * GET /api/clients/:id/validate-order
     * Validate if client can place order
     */
    async validateOrder(id: string, orderAmount: number): Promise<{
        approved: boolean;
        reason?: string;
        requiresApproval: boolean;
    }> {
        const client = await this.getById(id);
        if (!client) {
            return { approved: false, reason: 'Client not found', requiresApproval: false };
        }

        // Check credit limit
        if (checkCreditLimit(client, orderAmount)) {
            return {
                approved: false,
                reason: `Exceeds credit limit: ${client.creditLimit.toFixed(2)} SAR`,
                requiresApproval: true
            };
        }

        // Check overdue
        const data = localStorage.getItem('nexus_financial_transactions');
        const transactions: FinancialTransaction[] = data ? JSON.parse(data) : [];

        if (hasOverduePayments(client, transactions)) {
            return {
                approved: false,
                reason: 'Client has overdue payments',
                requiresApproval: true
            };
        }

        return { approved: true, requiresApproval: false };
    }
};

// ============================================
// FINANCIAL REPORTING ENDPOINTS
// ============================================

export const FinancialService = {
    /**
     * GET /api/financial/summary
     * Get financial dashboard summary
     */
    async getSummary(): Promise<{
        totalPayables: number;
        totalReceivables: number;
        netPosition: number;
        overdueCount: number;
        overdueAmount: number;
    }> {
        const vendors = await VendorService.getAll();
        const clients = await ClientService.getAll();
        const overdue = await ClientService.getOverdue();

        const totalPayables = vendors.reduce((sum, v) => sum + v.currentBalance, 0);
        const totalReceivables = clients.reduce((sum, c) => sum + c.currentBalance, 0);
        const overdueAmount = overdue.reduce((sum, a) => sum + a.amount, 0);

        return {
            totalPayables,
            totalReceivables,
            netPosition: totalReceivables - totalPayables,
            overdueCount: overdue.length,
            overdueAmount
        };
    },

    /**
     * GET /api/financial/aging-report
     * Get aging analysis
     */
    async getAgingReport(): Promise<{
        '0-30': number;
        '31-60': number;
        '61+': number;
    }> {
        const overdue = await ClientService.getOverdue();
        const aging = { '0-30': 0, '31-60': 0, '61+': 0 };

        overdue.forEach(alert => {
            if (alert.daysOverdue <= 30) aging['0-30'] += alert.amount;
            else if (alert.daysOverdue <= 60) aging['31-60'] += alert.amount;
            else aging['61+'] += alert.amount;
        });

        return aging;
    },

    /**
     * GET /api/financial/transactions
     * Get all financial transactions with filters
     */
    async getAllTransactions(filters?: {
        entityType?: EntityType;
        dateFrom?: string;
        dateTo?: string;
        type?: TransactionType;
    }): Promise<FinancialTransaction[]> {
        const data = localStorage.getItem('nexus_financial_transactions');
        let transactions: FinancialTransaction[] = data ? JSON.parse(data) : [];

        if (filters) {
            if (filters.entityType) {
                transactions = transactions.filter(t => t.entityType === filters.entityType);
            }
            if (filters.dateFrom) {
                transactions = transactions.filter(t => t.transactionDate >= filters.dateFrom!);
            }
            if (filters.dateTo) {
                transactions = transactions.filter(t => t.transactionDate <= filters.dateTo!);
            }
            if (filters.type) {
                transactions = transactions.filter(t => t.type === filters.type);
            }
        }

        return transactions.sort((a, b) =>
            new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
        );
    }
};

// Export all services
export default {
    Vendor: VendorService,
    Client: ClientService,
    Financial: FinancialService
};
