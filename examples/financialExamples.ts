/**
 * Nexus WMS - Financial Module Usage Examples
 * Quick reference guide for developers
 */

import FinancialAPI from './services/financialApi';
import { createVendorInvoice, createClientInvoice, checkCreditLimit } from './utils/financialHelpers';
import { PaymentTerms, Vendor, Client } from './types';

// ============================================
// EXAMPLE 1: Adding a New Vendor
// ============================================

async function addNewVendorExample() {
    const newVendor = await FinancialAPI.Vendor.create({
        name: 'شركة التوريدات الحديثة',
        contactPerson: 'أحمد محمد',
        phone: '+966501234567',
        address: 'الرياض، حي النخيل',
        taxId: '300012345600003',
        paymentTerms: PaymentTerms.HYBRID_SALES_LINKED,
        creditLimit: 100000,
        cashPercentage: 30, // 30% نقدي
        commissionPerUnit: 5 // 5 ر.س لكل وحدة مباعة
    });

    console.log('Vendor created:', newVendor);
    /*
    Output:
    {
      id: 'VEN-1738267210123',
      name: 'شركة التوريدات الحديثة',
      currentBalance: 0,
      paymentTerms: 'HYBRID_SALES_LINKED',
      ...
    }
    */
}

// ============================================
// EXAMPLE 2: Processing Purchase (Inbound)
// ============================================

async function processPurchaseExample() {
    // Step 1: Get vendor
    const vendor = await FinancialAPI.Vendor.getById('VEN-001');

    // Step 2: Create stock movement (simplified)
    const stockMovement = {
        id: `MOV-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'IN',
        productId: 'PROD-001',
        productName: 'صنف تجريبي',
        quantity: 100,
        unitCost: 50,
        vendorId: vendor!.id,
        user: 'Admin'
    };

    // Step 3: Create vendor invoice
    const { invoice, newBalance, cashPayment } = createVendorInvoice(
        vendor!,
        stockMovement,
        50, // unit cost
        100  // quantity
    );

    console.log('Invoice created:', invoice);
    console.log('New vendor balance:', newBalance);
    if (cashPayment) {
        console.log('Cash payment required:', cashPayment, 'SAR');
    }

    // Step 4: Update vendor balance
    await FinancialAPI.Vendor.update(vendor!.id, {
        currentBalance: newBalance
    });

    /*
    Output for HYBRID vendor (30% cash):
    {
      invoice: {
        id: 'fin-1738267210456',
        entityType: 'VENDOR',
        amount: 5000,
        balanceAfter: 3500,
        ...
      },
      newBalance: 3500,
      cashPayment: 1500
    }
    */
}

// ============================================
// EXAMPLE 3: Adding a New Client
// ============================================

async function addNewClientExample() {
    const newClient = await FinancialAPI.Client.create({
        name: 'سوبر ماركت الوسطى',
        contactPerson: 'خالد العتيبي',
        phone: '+966502345678',
        gpsLocation: '24.7136,46.6753',
        category: 'Retail',
        collectionPeriodDays: 15, // استحقاق خلال 15 يوم
        creditLimit: 50000,
        isActive: true
    });

    console.log('Client created:', newClient);
    /*
    Output:
    {
      id: 'CLI-1738267210789',
      name: 'سوبر ماركت الوسطى',
      currentBalance: 0,
      creditLimit: 50000,
      collectionPeriodDays: 15,
      ...
    }
    */
}

// ============================================
// EXAMPLE 4: Processing Sales (Outbound)
// ============================================

async function processSalesExample() {
    // Step 1: Get client
    const client = await FinancialAPI.Client.getById('CLI-001');

    // Step 2: Validate order
    const orderAmount = 10000;
    const validation = await FinancialAPI.Client.validateOrder(
        client!.id,
        orderAmount
    );

    if (!validation.approved) {
        console.log('⚠️ Order requires approval:', validation.reason);
        return;
    }

    // Step 3: Create stock movement
    const stockMovement = {
        id: `MOV-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'OUT',
        productId: 'PROD-001',
        productName: 'صنف تجريبي',
        quantity: 100,
        clientId: client!.id,
        user: 'Admin'
    };

    // Step 4: Create client invoice
    const { invoice, newBalance, dueDate } = createClientInvoice(
        client!,
        stockMovement,
        100, // unit price
        100  // quantity
    );

    console.log('Invoice created:', invoice);
    console.log('New client balance:', newBalance);
    console.log('Payment due date:', dueDate);

    // Step 5: Update client balance
    await FinancialAPI.Client.update(client!.id, {
        currentBalance: newBalance
    });

    /*
    Output:
    {
      invoice: {
        id: 'fin-1738267211012',
        entityType: 'CLIENT',
        amount: 10000,
        balanceAfter: 10000,
        dueDate: '2026-02-14', // 15 days from now
        ...
      },
      newBalance: 10000,
      dueDate: '2026-02-14'
    }
    */
}

// ============================================
// EXAMPLE 5: Recording Vendor Payment
// ============================================

async function recordVendorPaymentExample() {
    const payment = await FinancialAPI.Vendor.recordPayment(
        'VEN-001',
        5000, // amount
        'BANK-TRANSFER-123', // reference
        'دفعة شهرية - يناير 2026' // notes
    );

    console.log('Payment recorded:', payment);
    /*
    Output:
    {
      id: 'PAY-1738267211345',
      entityType: 'VENDOR',
      entityId: 'VEN-001',
      type: 'PAYMENT',
      amount: 5000,
      balanceAfter: -1500, // Previous balance was 3500
      paidDate: '2026-01-30',
      ...
    }
    */
}

// ============================================
// EXAMPLE 6: Recording Client Payment
// ============================================

async function recordClientPaymentExample() {
    const payment = await FinancialAPI.Client.recordPayment(
        'CLI-001',
        10000, // amount
        'fin-1738267211012', // invoice ID
        'دفعة نقدية - تحصيل فوري'
    );

    console.log('Payment received:', payment);
    /*
    Output:
    {
      id: 'RCV-1738267211678',
      entityType: 'CLIENT',
      entityId: 'CLI-001',
      type: 'PAYMENT',
      amount: 10000,
      balanceAfter: 0, // Previous balance was 10000
      paidDate: '2026-01-30',
      ...
    }
    */
}

// ============================================
// EXAMPLE 7: Getting Overdue Clients
// ============================================

async function getOverdueClientsExample() {
    const overdueAlerts = await FinancialAPI.Client.getOverdue();

    console.log('Overdue clients:', overdueAlerts);
    /*
    Output:
    [
      {
        id: 'fin-123',
        clientId: 'CLI-002',
        clientName: 'مجموعة الرياض التجارية',
        invoiceId: 'MOV-456',
        invoiceDate: '2025-12-15',
        dueDate: '2026-01-14',
        amount: 25000,
        daysOverdue: 16,
        currentBalance: 75000
      },
      ...
    ]
    */

    // Alert sales team for follow-up
    overdueAlerts.forEach(alert => {
        if (alert.daysOverdue > 30) {
            console.log(`🔴 URGENT: ${alert.clientName} - ${alert.daysOverdue} days overdue`);
        } else {
            console.log(`⚠️ ${alert.clientName} - ${alert.daysOverdue} days overdue`);
        }
    });
}

// ============================================
// EXAMPLE 8: Getting Financial Summary
// ============================================

async function getFinancialSummaryExample() {
    const summary = await FinancialAPI.Financial.getSummary();

    console.log('Financial Summary:', summary);
    /*
    Output:
    {
      totalPayables: 125000,      // Amount we owe vendors
      totalReceivables: 185000,   // Amount clients owe us
      netPosition: 60000,         // Net favorable position
      overdueCount: 5,            // 5 overdue invoices
      overdueAmount: 45000        // Total overdue amount
    }
    */

    // Display to management
    console.log('────────────────────────────');
    console.log(`إجمالي الدائن: ${summary.totalPayables.toLocaleString()} ر.س`);
    console.log(`إجمالي المدين: ${summary.totalReceivables.toLocaleString()} ر.س`);
    console.log(`صافي الوضع المالي: ${summary.netPosition.toLocaleString()} ر.س`);
    console.log(`متأخرات: ${summary.overdueCount} فاتورة (${summary.overdueAmount.toLocaleString()} ر.س)`);
    console.log('────────────────────────────');
}

// ============================================
// EXAMPLE 9: Getting Aging Report
// ============================================

async function getAgingReportExample() {
    const aging = await FinancialAPI.Financial.getAgingReport();

    console.log('Aging Report:', aging);
    /*
    Output:
    {
      '0-30': 25000,    // Fresh debts
      '31-60': 15000,   // Warning zone
      '61+': 5000       // Critical overdue
    }
    */

    // Visual representation
    console.log('تحليل أعمار الديون:');
    console.log(`├─ 0-30 يوم:    ${aging['0-30'].toLocaleString()} ر.س`);
    console.log(`├─ 31-60 يوم:   ${aging['31-60'].toLocaleString()} ر.س`);
    console.log(`└─ أكثر من 60:  ${aging['61+'].toLocaleString()} ر.س`);
}

// ============================================
// EXAMPLE 10: Getting Statement of Account
// ============================================

async function getStatementOfAccountExample() {
    const transactions = await FinancialAPI.Vendor.getTransactions(
        'VEN-001',
        '2026-01-01', // from date
        '2026-01-31'  // to date
    );

    console.log('Vendor Statement:', transactions);
    /*
    Output:
    [
      {
        id: 'fin-123',
        transactionDate: '2026-01-15',
        type: 'INVOICE',
        amount: 5000,
        balanceAfter: 5000,
        referenceDocId: 'MOV-456',
        notes: 'Purchase: صنف تجريبي - Qty: 100 @ 50.00'
      },
      {
        id: 'PAY-124',
        transactionDate: '2026-01-20',
        type: 'PAYMENT',
        amount: 2500,
        balanceAfter: 2500,
        referenceDocId: 'BANK-TRANSFER-123'
      },
      ...
    ]
    */

    // Print statement
    console.log('\n══════════════════════════════════════');
    console.log('       كشف حساب المورد');
    console.log('══════════════════════════════════════');
    transactions.forEach(t => {
        const sign = t.type === 'INVOICE' ? '+' : '-';
        console.log(`${new Date(t.transactionDate).toLocaleDateString('ar-SA')}  ${t.type}  ${sign}${t.amount.toLocaleString()}  ⟵  ${t.balanceAfter.toLocaleString()}`);
    });
    console.log('══════════════════════════════════════\n');
}

// ============================================
// EXAMPLE 11: Complete Workflow - Purchase to Payment
// ============================================

async function completePurchaseWorkflowExample() {
    console.log('════════════════════════════════════');
    console.log('   سير عمل الشراء الكامل');
    console.log('════════════════════════════════════\n');

    // 1. Add vendor
    console.log('📝 Step 1: إضافة مورد جديد');
    const vendor = await FinancialAPI.Vendor.create({
        name: 'شركة النخيل للتجارة',
        contactPerson: 'محمد السعيد',
        phone: '+966503456789',
        address: 'جدة',
        taxId: '300123456700003',
        paymentTerms: PaymentTerms.CREDIT,
        creditLimit: 50000
    });
    console.log(`✅ تم إضافة المورد: ${vendor.name} (${vendor.id})\n`);

    // 2. Process purchase
    console.log('📦 Step 2: استلام بضاعة');
    const movement = {
        id: `MOV-${Date.now()}`,
        productId: 'PROD-001',
        productName: 'منتج تجريبي',
        quantity: 50,
        unitCost: 100,
        vendorId: vendor.id
    } as any;

    const { invoice, newBalance } = createVendorInvoice(vendor, movement, 100, 50);
    await FinancialAPI.Vendor.update(vendor.id, { currentBalance: newBalance });
    console.log(`✅ فاتورة بمبلغ ${invoice.amount.toLocaleString()} ر.س`);
    console.log(`   رصيد المورد: ${newBalance.toLocaleString()} ر.س\n`);

    // 3. Make payment
    console.log('💰 Step 3: تسديد دفعة');
    await FinancialAPI.Vendor.recordPayment(vendor.id, 2500, 'CASH-001', 'دفعة أولية');
    const updatedVendor = await FinancialAPI.Vendor.getById(vendor.id);
    console.log(`✅ تم تسديد 2,500 ر.س`);
    console.log(`   الرصيد المتبقي: ${updatedVendor!.currentBalance.toLocaleString()} ر.س\n`);

    console.log('════════════════════════════════════\n');
}

// ============================================
// Run Examples (Uncomment to test)
// ============================================

// addNewVendorExample();
// processPurchaseExample();
// addNewClientExample();
// processSalesExample();
// recordVendorPaymentExample();
// recordClientPaymentExample();
// getOverdueClientsExample();
// getFinancialSummaryExample();
// getAgingReportExample();
// getStatementOfAccountExample();
// completePurchaseWorkflowExample();

export {
    addNewVendorExample,
    processPurchaseExample,
    addNewClientExample,
    processSalesExample,
    recordVendorPaymentExample,
    recordClientPaymentExample,
    getOverdueClientsExample,
    getFinancialSummaryExample,
    getAgingReportExample,
    getStatementOfAccountExample,
    completePurchaseWorkflowExample
};
