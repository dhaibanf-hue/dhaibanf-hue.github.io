// Financial Helper Functions

import { Vendor, Client, FinancialTransaction, PaymentTerms, EntityType, TransactionType, StockMovement } from '../types';

/**
 * Create a financial invoice for vendor when receiving goods
 */
export const createVendorInvoice = (
    vendor: Vendor,
    movement: StockMovement,
    unitCost: number,
    quantity: number
): { invoice: FinancialTransaction; newBalance: number; cashPayment?: number } => {
    const totalAmount = unitCost * quantity;
    let cashPayment: number | undefined;
    let invoiceAmount = totalAmount;

    // Handle payment terms
    if (vendor.paymentTerms === PaymentTerms.CASH) {
        cashPayment = totalAmount;
        invoiceAmount = 0; // No balance added for CASH
    } else if (vendor.paymentTerms === PaymentTerms.HYBRID_SALES_LINKED && vendor.cashPercentage) {
        cashPayment = totalAmount * (vendor.cashPercentage / 100);
        invoiceAmount = totalAmount - cashPayment; // Rest added to balance
    }

    const newBalance = vendor.currentBalance + invoiceAmount;

    const invoice: FinancialTransaction = {
        id: `fin-${Date.now()}`,
        entityType: EntityType.VENDOR,
        entityId: vendor.id,
        entityName: vendor.name,
        transactionDate: new Date().toISOString(),
        type: TransactionType.INVOICE,
        amount: totalAmount,
        balanceAfter: newBalance,
        referenceDocId: movement.id,
        notes: `Purchase: ${movement.productName} - Qty: ${quantity} @ ${unitCost.toFixed(2)}`
    };

    return { invoice, newBalance, cashPayment };
};

/**
 * Create a financial invoice for client when dispatching goods
 */
export const createClientInvoice = (
    client: Client,
    movement: StockMovement,
    unitPrice: number,
    quantity: number
): { invoice: FinancialTransaction; newBalance: number; dueDate: string } => {
    const totalAmount = unitPrice * quantity;
    const newBalance = client.currentBalance + totalAmount;

    // Calculate due date based on collection period
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + client.collectionPeriodDays);

    const invoice: FinancialTransaction = {
        id: `fin-${Date.now()}`,
        entityType: EntityType.CLIENT,
        entityId: client.id,
        entityName: client.name,
        transactionDate: new Date().toISOString(),
        type: TransactionType.INVOICE,
        amount: totalAmount,
        balanceAfter: newBalance,
        referenceDocId: movement.id,
        dueDate: dueDate.toISOString().split('T')[0],
        notes: `Sales: ${movement.productName} - Qty: ${quantity} @ ${unitPrice.toFixed(2)}`
    };

    return { invoice, newBalance, dueDate: dueDate.toISOString().split('T')[0] };
};

/**
 * Calculate sales-linked vendor payment
 * For HYBRID_SALES_LINKED vendors with commission per unit
 */
export const calculateSalesLinkedPayment = (
    vendor: Vendor,
    unitsSold: number
): number => {
    if (vendor.paymentTerms !== PaymentTerms.HYBRID_SALES_LINKED || !vendor.commissionPerUnit) {
        return 0;
    }
    return unitsSold * vendor.commissionPerUnit;
};

/**
 * Check if client exceeds credit limit
 */
export const checkCreditLimit = (client: Client, newOrderAmount: number): boolean => {
    return (client.currentBalance + newOrderAmount) > client.creditLimit;
};

/**
 * Check if client has overdue payments
 */
export const hasOverduePayments = (
    client: Client,
    transactions: FinancialTransaction[]
): boolean => {
    const today = new Date();
    return transactions.some(t =>
        t.entityId === client.id &&
        t.entityType === EntityType.CLIENT &&
        t.type === TransactionType.INVOICE &&
        t.dueDate &&
        !t.paidDate &&
        new Date(t.dueDate) < today
    );
};
